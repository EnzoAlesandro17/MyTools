// MyTools - helpers compartidos entre modulos
window.App3 = (function(){
  const EPS = 0.005;

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escapeAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  function capitalizeWords(str){
    if(!str) return str;
    return str.toLowerCase().split(' ').map(w => w.length ? w[0].toUpperCase()+w.slice(1) : w).join(' ');
  }

  function fmtMoney(n){
    const v = Number(n) || 0;
    return '$' + v.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2});
  }

  function todayStr(){
    const d = new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }

  function fmtDateLong(d){
    const s = d.toLocaleDateString('es-AR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function downloadUrl(url, filename){
    const a = document.createElement('a');
    a.href = url; if(filename) a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // Iconos por seccion, compartidos entre el encabezado de cada modulo y las
  // tarjetas del dashboard/hubs, para no duplicar el SVG en cada lugar.
  const ICONS = {
    arqueo: '<circle cx="17" cy="17" r="10.5" stroke="#da291c" stroke-width="1.6"/><text x="17" y="21.5" text-anchor="middle" font-size="12" font-weight="700" fill="#da291c" font-family="sans-serif">$</text>',
    fibra: '<path d="M6 17 C 12 17, 12 9, 17 9 S 22 17, 28 17" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M6 17 C 12 17, 12 25, 17 25 S 22 17, 28 17" stroke="#0097a9" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.7"/><circle cx="17" cy="17" r="2.4" fill="#da291c"/>',
    ventas: '<rect x="9.5" y="18" width="3" height="7" rx="1" fill="#da291c"/><rect x="15.5" y="13" width="3" height="12" rx="1" fill="#da291c"/><rect x="21.5" y="9" width="3" height="16" rx="1" fill="#da291c"/>',
    sucursal: '<path d="M8 15 L17 8 L26 15" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="10" y="15" width="14" height="10" rx="1" stroke="#da291c" stroke-width="1.6" fill="none"/><rect x="15" y="19" width="4" height="6" fill="#da291c"/>',
    enlaces: '<path d="M12 9 H22 V25 L17 21 L12 25 Z" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
    config: '<line x1="10" y1="12" x2="24" y2="12" stroke="#da291c" stroke-width="1.6" stroke-linecap="round"/><circle cx="20" cy="12" r="2.2" fill="#da291c"/><line x1="10" y1="17" x2="24" y2="17" stroke="#da291c" stroke-width="1.6" stroke-linecap="round"/><circle cx="14" cy="17" r="2.2" fill="#da291c"/><line x1="10" y1="22" x2="24" y2="22" stroke="#da291c" stroke-width="1.6" stroke-linecap="round"/><circle cx="19" cy="22" r="2.2" fill="#da291c"/>',
  };
  function moduleIcon(id, cls){
    const inner = ICONS[id] || '';
    return `<svg class="${cls||''}" viewBox="0 0 34 34" fill="none"><circle cx="17" cy="17" r="15.5" stroke="#e8d4d6" stroke-width="1.5"/>${inner}</svg>`;
  }

  async function api(path, options){
    const opts = Object.assign({headers:{}}, options || {});
    if(opts.body && !(opts.body instanceof FormData)){
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(path, opts);
    if(!res.ok){
      let msg = `Error ${res.status}`;
      try{ const data = await res.json(); if(data && data.error) msg = data.error; }catch(e){}
      throw new Error(msg);
    }
    if(res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  // Grilla de tarjetas de acceso a secciones, usada por el dashboard principal
  // y por cualquier hub anidado (ej: Control de Ventas). `summaries` es un mapa
  // id -> funcion async que devuelve [{n, l, cls}] para las stats de la tarjeta.
  function renderSectionCards(grid, sections, summaries, goTo){
    grid.innerHTML = sections.map(s => `
      <div class="dash-card" data-id="${s.id}" role="button" tabindex="0">
        <div class="dash-card-head">
          <div class="dash-card-top">
            ${moduleIcon(s.id, 'dash-card-icon')}
            <div class="dash-card-title">${escapeHtml(s.label)}</div>
          </div>
          <div class="dash-card-desc">${escapeHtml(s.desc||'')}</div>
        </div>
        <div class="dash-card-stats" id="dashStats-${s.id}">
          <div class="dash-card-loading">Cargando…</div>
        </div>
        <div class="dash-card-foot">Ver detalle completo</div>
      </div>
    `).join('');

    grid.querySelectorAll('.dash-card').forEach(card => {
      const go = () => goTo(card.dataset.id);
      card.addEventListener('click', go);
      card.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
    });

    sections.forEach(async (s) => {
      const provider = summaries[s.id];
      const statsEl = grid.querySelector(`#dashStats-${s.id}`);
      if(!statsEl) return;
      if(!provider){ statsEl.innerHTML = ''; return; }
      try{
        const items = await provider();
        statsEl.innerHTML = items.map(it => `
          <div class="stat"><div class="n ${it.cls||''}">${it.n}</div><div class="l">${escapeHtml(it.l)}</div></div>
        `).join('');
      }catch(e){
        statsEl.innerHTML = `<div class="dash-card-loading">No se pudo cargar</div>`;
      }
    });
  }

  return { EPS, escapeHtml, escapeAttr, capitalizeWords, fmtMoney, todayStr, fmtDateLong, downloadUrl, api, renderSectionCards, moduleIcon };
})();
