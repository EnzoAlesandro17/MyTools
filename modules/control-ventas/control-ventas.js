// MyTools - modulo Control de Ventas (hub: agrupa los distintos formularios de venta)
window.ControlVentasModule = (function(){
  const { api, renderSectionCards, moduleIcon } = window.App3;

  // Sub-secciones dentro de Control de Ventas. Para sumar una nueva linea de
  // venta: crear su modulo (mount/unmount), agregar el <script src> en
  // app.html, sumarla aca y opcionalmente registrar un resumen mas abajo.
  const VENTAS_SECTIONS = [
    { id: 'fibra', code: 'FO', label: 'Fibra óptica', desc: 'Registro de gestiones de venta e instalación' },
  ];

  const SUMMARIES = {
    fibra: async function(){
      const ventas = await api('/api/fibra/ventas');
      const key = (function(){ const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })();
      const delMes = ventas.filter(v => (v.fechaIngreso||'').slice(0,7) === key);
      const sinPactar = delMes.filter(v => v.estado === 'Falta pactar').length;
      return [
        { n: delMes.length, l: 'Ventas este mes' },
        { n: sinPactar, l: 'Sin pactar' },
      ];
    },
  };

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Inicio</button>
      <div class="head">
        <div class="brand">
          ${moduleIcon('ventas', 'mod-icon')}
          <div>
            <h1>Control de Ventas</h1>
            <div class="sub">Gestión de ventas y servicios</div>
          </div>
        </div>
      </div>

      <div class="fiber-line"></div>

      <div class="page-eyebrow">Secciones</div>
      <div class="dash-grid" id="dashGrid"></div>
    </div>
  `;

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const $ = (id) => root.querySelector('#'+id);
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('dashboard'));

    const grid = $('dashGrid');
    renderSectionCards(grid, VENTAS_SECTIONS, SUMMARIES, ctx.goTo);
  }

  function unmount(){}

  return { mount, unmount };
})();
