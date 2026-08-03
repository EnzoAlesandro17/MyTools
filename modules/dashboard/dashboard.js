// MyTools - modulo Dashboard (pantalla de inicio, tarjetas de acceso a cada seccion)
window.DashboardModule = (function(){
  const { fmtMoney, api, renderSectionCards, ventaMonthKey } = window.App3;
  const EPS = 0.005;

  const TEMPLATE = `
    <div class="wrap">
      <div class="page-eyebrow">Accesos rápidos</div>
      <div class="dash-grid" id="dashGrid"></div>
    </div>
  `;

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

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const grid = root.querySelector('#dashGrid');
    renderSectionCards(grid, (ctx && ctx.sections) || [], SECTION_SUMMARIES, ctx.goTo);
  }

  function unmount(){}

  return { mount, unmount };
})();
