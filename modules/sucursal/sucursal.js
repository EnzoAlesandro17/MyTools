// MyTools - modulo Sucursal y Empleados (identidad de la sucursal + equipo de trabajo)
window.SucursalModule = (function(){
  const { escapeHtml, escapeAttr, capitalizeWords, api, moduleIcon } = window.App3;

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Inicio</button>
      <div class="head">
        <div class="brand">
          ${moduleIcon('sucursal', 'mod-icon')}
          <div>
            <h1>Sucursal y Empleados</h1>
            <div class="sub">Datos del negocio y equipo de trabajo</div>
          </div>
        </div>
      </div>

      <div class="fiber-line"></div>

      <div class="settings-col">
        <div class="section-title">Datos de la sucursal</div>
        <div class="grid">
          <div class="field full">
            <label>Nombre de la sucursal</label>
            <input type="text" id="cfgSucursal" placeholder="Ej: Sucursal Rosario Centro">
          </div>
        </div>
        <button class="btn" id="saveNombreBtn">Guardar cambios</button>
        <span class="meta-note" id="savedNote" style="margin-left:10px;"></span>

        <div class="section-title" style="margin-top:32px;">Empleados</div>
        <div class="cfg-list" id="cfgEmpleados"></div>
        <div class="cfg-add">
          <input type="text" id="cfgEmpleadoNombre" placeholder="Nombre">
          <input type="text" id="cfgEmpleadoRol" placeholder="Rol (ej: Vendedor, Supervisor)" list="rolOptions">
          <datalist id="rolOptions">
            <option value="Vendedor"></option>
            <option value="Vendedora"></option>
            <option value="Supervisor"></option>
            <option value="Encargado"></option>
            <option value="Encargada"></option>
          </datalist>
          <button class="btn secondary small" id="cfgEmpleadoAddBtn">Agregar</button>
        </div>
        <div class="hint">Este equipo se usa en Arqueo de Caja (empleados presentes) y en Control de Ventas (selector de vendedor). Si cambiás o quitás a alguien acá, los registros ya cargados con ese nombre no se modifican.</div>
      </div>
    </div>
  `;

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const $ = (id) => root.querySelector('#'+id);
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('dashboard'));

    let empleados = [];

    async function loadEmpleados(){
      empleados = await api('/api/empleados');
      renderEmpleados();
    }

    function renderEmpleados(){
      $('cfgEmpleados').innerHTML = empleados.length
        ? empleados.map(emp => `<div class="cfg-item"><span>${escapeHtml(emp.nombre)}</span><span class="cfg-rol">${escapeHtml(emp.rol||'')}</span><button class="cfg-del" data-id="${escapeAttr(emp.id)}" title="Quitar">&times;</button></div>`).join('')
        : `<div class="cfg-empty">Sin empleados cargados todavía.</div>`;
      $('cfgEmpleados').querySelectorAll('.cfg-del').forEach(btn => {
        btn.addEventListener('click', () => removeEmpleado(btn.dataset.id));
      });
    }

    async function removeEmpleado(id){
      await api(`/api/empleados/${id}`, { method:'DELETE' });
      await loadEmpleados();
    }

    async function addEmpleado(){
      const nombreInput = $('cfgEmpleadoNombre');
      const rolInput = $('cfgEmpleadoRol');
      const nombre = capitalizeWords(nombreInput.value.trim());
      const rol = capitalizeWords(rolInput.value.trim());
      if(!nombre) return;
      if(empleados.some(e => e.nombre.toLowerCase() === nombre.toLowerCase())){ nombreInput.value=''; rolInput.value=''; return; }
      await api('/api/empleados', { method:'POST', body: { nombre, rol } });
      nombreInput.value = ''; rolInput.value = '';
      await loadEmpleados();
    }

    $('cfgEmpleadoAddBtn').addEventListener('click', addEmpleado);
    $('cfgEmpleadoNombre').addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); addEmpleado(); } });
    $('cfgEmpleadoRol').addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); addEmpleado(); } });

    async function loadSucursal(){
      const cfg = await api('/api/config');
      $('cfgSucursal').value = cfg.nombre_sucursal || '';
    }

    async function saveSucursal(){
      const payload = { nombre_sucursal: $('cfgSucursal').value.trim() };
      await api('/api/config', { method:'PUT', body: payload });
      const note = $('savedNote');
      note.textContent = 'Guardado ✓';
      setTimeout(() => { note.textContent = ''; }, 2000);
    }
    $('saveNombreBtn').addEventListener('click', saveSucursal);

    loadSucursal();
    loadEmpleados();
  }

  function unmount(){}

  return { mount, unmount };
})();
