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

  // Mes "efectivo" de una venta de fibra: el de la fecha mas tardia entre
  // ingreso, pactada e instalacion. Si se pacta o instala en un mes posterior
  // al de ingreso, la venta pasa a contarse en ese mes en vez del de ingreso.
  function ventaMonthKey(v){
    const fechas = [v.fechaIngreso, v.fechaPactada, v.fechaInstalacion].filter(Boolean);
    if(!fechas.length) return '';
    return fechas.reduce((max, d) => d > max ? d : max).slice(0,7);
  }

  // ---------- Fechas: input de texto con mascara dd/mm/aaaa ----------
  // El valor "de verdad" siempre se guarda/envia como ISO (aaaa-mm-dd); estas
  // funciones convierten entre eso y lo que ve/escribe el usuario.
  function isoToDisplayDate(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
  }

  // Acepta dd/mm/aaaa, dd-mm-aaaa, aaaa-mm-dd, aaaa/mm/dd, años de 2 digitos
  // y pegado sin separadores (dd mm aaaa). Devuelve ISO o null si no es una
  // fecha valida.
  function parseDateToIso(str){
    str = String(str || '').trim();
    if(!str) return null;
    let d, mo, y;
    if(/[\/\-.]/.test(str)){
      const parts = str.split(/[\/\-.]+/).filter(Boolean);
      if(parts.length !== 3) return null;
      if(parts[0].length === 4){ [y, mo, d] = parts; } else { [d, mo, y] = parts; }
    } else {
      const digits = str.replace(/\D/g,'');
      if(digits.length === 8){ d = digits.slice(0,2); mo = digits.slice(2,4); y = digits.slice(4,8); }
      else if(digits.length === 6){ d = digits.slice(0,2); mo = digits.slice(2,4); y = digits.slice(4,6); }
      else return null;
    }
    if(String(y).length === 2) y = (Number(y) <= 69 ? '20' : '19') + String(y).padStart(2,'0');
    const dn = Number(d), mon = Number(mo), yn = Number(y);
    if(!dn || !mon || !yn || mon > 12 || dn > 31) return null;
    const iso = `${String(yn).padStart(4,'0')}-${String(mon).padStart(2,'0')}-${String(dn).padStart(2,'0')}`;
    const dt = new Date(iso + 'T00:00:00');
    if(dt.getFullYear() !== yn || dt.getMonth()+1 !== mon || dt.getDate() !== dn) return null;
    return iso;
  }

  function formatTypedDate(raw){
    const digits = String(raw || '').replace(/\D/g,'').slice(0,8);
    let out = digits.slice(0,2);
    if(digits.length > 2) out += '/' + digits.slice(2,4);
    if(digits.length > 4) out += '/' + digits.slice(4,8);
    return out;
  }

  // Convierte un <input type="text"> en un campo de fecha dd/mm/aaaa: agrega
  // las barras solo mientras se escribe, y al pegar interpreta el formato que
  // haya (con barras, guiones o sin separador) y lo acomoda.
  function attachDateMask(el){
    if(!el) return;
    el.setAttribute('placeholder', 'dd/mm/aaaa');
    el.setAttribute('inputmode', 'numeric');
    el.setAttribute('maxlength', '10');
    el.setAttribute('autocomplete', 'off');
    el.addEventListener('input', () => {
      el.value = formatTypedDate(el.value);
      el.selectionStart = el.selectionEnd = el.value.length;
    });
    el.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text');
      const iso = parseDateToIso(text);
      el.value = iso ? isoToDisplayDate(iso) : formatTypedDate(text);
    });
  }

  function downloadUrl(url, filename){
    const a = document.createElement('a');
    a.href = url; if(filename) a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  // Iconos por seccion, compartidos entre el encabezado de cada modulo y las
  // tarjetas del dashboard/hubs, para no duplicar el SVG en cada lugar.
  const ICONS = {
    tareas: '<rect x="10" y="8" width="14" height="18" rx="2" stroke="#da291c" stroke-width="1.6" fill="none"/><rect x="14" y="6" width="6" height="3" rx="1" fill="#da291c"/><path d="M12 14.5 L13.5 16 L16.3 12.7" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="18.3" y1="14.5" x2="22" y2="14.5" stroke="#da291c" stroke-width="1.6" stroke-linecap="round"/><path d="M12 20.5 L13.5 22 L16.3 18.7" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="18.3" y1="20.5" x2="22" y2="20.5" stroke="#da291c" stroke-width="1.6" stroke-linecap="round"/>',
    arqueo: '<circle cx="17" cy="17" r="10.5" stroke="#da291c" stroke-width="1.6"/><text x="17" y="21.5" text-anchor="middle" font-size="12" font-weight="700" fill="#da291c" font-family="sans-serif">$</text>',
    fibra: '<circle cx="17" cy="23" r="1.7" fill="#da291c"/><path d="M13 20 A 5.7 5.7 0 0 1 21 20" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M9.5 16 A 10.7 10.7 0 0 1 24.5 16" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.75"/><path d="M6 12 A 15.6 15.6 0 0 1 28 12" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.5"/>',
    ventas: '<path d="M13.5 13 V11.2 A3.5 3.5 0 0 1 20.5 11.2 V13" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M11 13 H23 L24.4 24.8 A1.6 1.6 0 0 1 22.8 26.5 H11.2 A1.6 1.6 0 0 1 9.6 24.8 Z" stroke="#da291c" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
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

  return { EPS, escapeHtml, escapeAttr, capitalizeWords, fmtMoney, todayStr, fmtDateLong, ventaMonthKey, downloadUrl, api, renderSectionCards, moduleIcon, isoToDisplayDate, parseDateToIso, attachDateMask };
})();
