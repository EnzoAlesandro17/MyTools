// MyTools - modulo Dashboard (pantalla de inicio, tarjetas de acceso a cada seccion)
window.DashboardModule = (function(){
  const { fmtMoney, api, renderSectionCards, ventaMonthKey, escapeHtml, escapeAttr } = window.App3;
  const EPS = 0.005;

  const TEMPLATE = `
    <div class="wrap">
      <div class="week-cal" id="weekCal"></div>
      <div class="page-eyebrow">Accesos rápidos</div>
      <div class="dash-grid" id="dashGrid"></div>
    </div>
  `;

  const DIAS_ABR = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  function isoOf(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

  function ventaEstadoColor(estado){
    if(estado === 'Instalada') return '#2e7d32';
    if(estado === 'Cancelada') return '#c62828';
    return '#b8860b'; // Pactada / Falta pactar
  }

  function weekDaysOf(d){
    const dow = d.getDay(); // 0=domingo .. 6=sabado
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
    return Array.from({length:7}, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()+i));
  }

  function monthKeyOf(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
  function amountLabel(n){
    if(n > EPS) return fmtMoney(n);
    if(n < -EPS) return fmtMoney(Math.abs(n));
    return 'Bien';
  }
  function resultClass(n){
    if(n > EPS) return 'pos';
    if(n < -EPS) return 'neg';
    return '';
  }

  // Cada seccion que sepa dar un resumen se registra aca por id.
  // Una seccion nueva que no tenga entrada simplemente no muestra stats en su tarjeta.
  const SECTION_SUMMARIES = {
    tareas: async function(){
      const tareas = await api('/api/tareas');
      const abiertas = tareas.filter(t => t.estado !== 'cerrada');
      const prioritarias = abiertas.filter(t => t.prioritaria).length;
      return [
        { n: abiertas.length, l: 'Abiertas' },
        { n: prioritarias, l: 'Prioritarias' },
      ];
    },
    arqueo: async function(){
      const registros = await api('/api/arqueo/registros');
      const key = monthKeyOf(new Date());
      const delMes = registros.filter(r => String(r.fecha||'').slice(0,7) === key);
      const ultimo = registros.slice().sort((a,b) => String(b.fecha||'').localeCompare(String(a.fecha||'')))[0];
      return [
        { n: delMes.length, l: 'Este mes' },
        { n: ultimo ? amountLabel(ultimo.resultado||0) : '—', l: 'Resultado', cls: ultimo ? resultClass(ultimo.resultado||0) : '' },
      ];
    },
    // "Control de Ventas" es un hub con sub-secciones (Fibra óptica, y las que se sumen);
    // por ahora el resumen en Inicio agrega los datos de Fibra.
    ventas: async function(){
      const ventas = await api('/api/fibra/ventas');
      const key = monthKeyOf(new Date());
      const delMes = ventas.filter(v => ventaMonthKey(v) === key);
      const sinPactar = delMes.filter(v => v.estado === 'Falta pactar').length;
      return [
        { n: delMes.length, l: 'Este mes' },
        { n: sinPactar, l: 'Sin pactar' },
      ];
    },
    enlaces: async function(){
      const enlaces = await api('/api/enlaces');
      const categorias = new Set(enlaces.map(e => e.categoria).filter(Boolean));
      return [
        { n: enlaces.length, l: 'Guardados' },
        { n: categorias.size, l: 'Categorías' },
      ];
    },
  };

  async function loadWeekCal(root, goTo){
    const cal = root.querySelector('#weekCal');
    const [tareas, ventas] = await Promise.all([
      api('/api/tareas').catch(() => []),
      api('/api/fibra/ventas').catch(() => []),
    ]);
    const hoy = new Date();
    const hoyIso = isoOf(hoy);
    const dias = weekDaysOf(hoy);
    const rangeLbl = `${String(dias[0].getDate()).padStart(2,'0')}/${String(dias[0].getMonth()+1).padStart(2,'0')} - ${String(dias[6].getDate()).padStart(2,'0')}/${String(dias[6].getMonth()+1).padStart(2,'0')}`;

    const html = dias.map(d => {
      const iso = isoOf(d);
      const esHoy = iso === hoyIso;
      const tareasDelDia = tareas.filter(t => t.estado !== 'cerrada' && t.fechaLimite === iso);
      const ventasDelDia = ventas.filter(v => (v.fechaInstalacion || v.fechaPactada) === iso);
      const items = [
        ...tareasDelDia.map(t => `<div class="week-item tarea${t.prioritaria ? ' priority' : ''}" data-go="tareas" title="${escapeAttr(t.titulo)}">📋 ${escapeHtml(t.titulo)}</div>`),
        ...ventasDelDia.map(v => `<div class="week-item venta" data-go="fibra" title="${escapeAttr(v.clienteNombre||'')}" style="border-left:4px solid ${ventaEstadoColor(v.estado)};padding-left:6px;">📶 ${escapeHtml(v.clienteNombre||'Sin nombre')}</div>`),
      ].join('') || '<div class="week-day-empty">—</div>';
      return `
        <div class="week-day${esHoy ? ' today' : ''}">
          <div class="week-day-name">${DIAS_ABR[d.getDay()]}</div>
          <div class="week-day-date">${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</div>
          <div class="week-day-items">${items}</div>
        </div>
      `;
    }).join('');

    cal.innerHTML = `
      <div class="week-cal-head">
        <div class="week-cal-title">Esta semana</div>
        <div class="week-cal-range">${rangeLbl}</div>
      </div>
      <div class="week-cal-grid">${html}</div>
    `;
    cal.querySelectorAll('.week-item[data-go]').forEach(el => {
      el.addEventListener('click', () => goTo(el.dataset.go));
    });
  }

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const grid = root.querySelector('#dashGrid');
    renderSectionCards(grid, (ctx && ctx.sections) || [], SECTION_SUMMARIES, ctx.goTo);
    loadWeekCal(root, ctx.goTo);
  }

  function unmount(){}

  return { mount, unmount };
})();
