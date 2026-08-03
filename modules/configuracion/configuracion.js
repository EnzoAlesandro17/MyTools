// MyTools - modulo Configuracion (ajustes generales de la app, organizados por seccion)
window.ConfiguracionModule = (function(){
  const { escapeHtml, escapeAttr, capitalizeWords, api, moduleIcon } = window.App3;

  const COUNT_LABELS = {
    sucursales: 'Sucursales', empleados: 'Empleados', arqueos: 'Arqueos',
    planes: 'Planes', ventas: 'Ventas', enlaces: 'Enlaces',
  };

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Inicio</button>
      <div class="head">
        <div class="brand">
          ${moduleIcon('config', 'mod-icon')}
          <div>
            <h1>Configuración</h1>
            <div class="sub">Ajustes generales de la aplicación</div>
          </div>
        </div>
      </div>

      <div class="fiber-line"></div>

      <div class="settings-col">

        <div class="cfg-card">
          <div class="section-title">General</div>

          <div class="subsection-title">Sucursales</div>
          <div class="cfg-list" id="cfgSucursales"></div>
          <div class="grid cols-3">
            <div class="field"><label>Nombre</label><input type="text" id="cfgSucNombre" placeholder="Ej: Casa Central"></div>
            <div class="field"><label>Código interno</label><input type="text" id="cfgSucCodigo" placeholder="Ej: CC1"></div>
            <div class="field"><label>Dirección</label><input type="text" id="cfgSucDireccion" placeholder="Ej: San Martín 1234"></div>
          </div>
          <button class="btn secondary small" id="cfgSucAddBtn" style="margin-top:12px;">Agregar sucursal</button>

          <div class="subsection-title">Empleados</div>
          <div class="cfg-list" id="cfgEmpleados"></div>
          <div class="grid cols-3">
            <div class="field"><label>Nombre</label><input type="text" id="cfgEmpNombre" placeholder="Nombre"></div>
            <div class="field"><label>Apellido</label><input type="text" id="cfgEmpApellido" placeholder="Apellido"></div>
            <div class="field"><label>DNI</label><input type="text" id="cfgEmpDni" placeholder="DNI"></div>
            <div class="field"><label>Teléfono</label><input type="text" id="cfgEmpTelefono" placeholder="Teléfono"></div>
            <div class="field"><label>Mail</label><input type="text" id="cfgEmpEmail" placeholder="Mail"></div>
            <div class="field"><label>Código interno</label><input type="text" id="cfgEmpCodigo" placeholder="Código interno"></div>
          </div>
          <button class="btn secondary small" id="cfgEmpAddBtn" style="margin-top:12px;">Agregar empleado</button>
        </div>

        <div class="cfg-card">
          <div class="section-title">Clima</div>

          <div class="subsection-title">Unidades</div>
          <div class="grid">
            <div class="field"><label>Temperatura</label>
              <select id="cfgUnidadTemp">
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
              </select>
            </div>
            <div class="field"><label>Presión</label>
              <select id="cfgUnidadPresion">
                <option value="hPa">hPa</option>
                <option value="mmHg">mmHg</option>
              </select>
            </div>
          </div>

          <div class="subsection-title">Ciudad</div>
          <div class="grid">
            <div class="field full"><input type="text" id="cfgCiudad" placeholder="Rosario"></div>
          </div>

          <div class="cfg-card-foot">
            <button class="btn" id="saveClimaBtn">Guardar cambios</button>
            <span class="meta-note" id="climaSavedNote"></span>
          </div>
        </div>

        <div class="cfg-card">
          <div class="section-title">Arqueo de caja</div>
          <input type="file" id="arqueoImportInput" accept=".xlsx,.xls" style="display:none;">
          <div class="cfg-data-actions">
            <button class="btn secondary small" id="arqueoImportBtn">Importar Excel</button>
            <button class="btn secondary small" id="arqueoExportBtn">Exportar Excel</button>
          </div>
        </div>

        <div class="cfg-card">
          <div class="section-title">Control de ventas</div>
          <div class="subsection-title">Fibra óptica</div>

          <input type="file" id="fibraImportInput" accept=".xlsx,.xls" style="display:none;">
          <div class="cfg-data-actions">
            <button class="btn secondary small" id="fibraImportBtn">Importar Excel</button>
            <button class="btn secondary small" id="fibraExportBtn">Exportar Excel</button>
          </div>

          <div class="subsection-title">Planes de internet (MB)</div>
          <div class="cfg-list" id="cfgPlanes"></div>
          <div class="grid">
            <div class="field"><input type="number" id="cfgPlanInput" min="0" step="1" placeholder="Ej: 300"></div>
          </div>
          <button class="btn secondary small" id="cfgPlanAddBtn" style="margin-top:12px;">Agregar plan</button>
        </div>

        <div class="cfg-card">
          <div class="section-title">Acerca de esta instalación</div>
          <div class="hint" style="margin-bottom:16px;">
            MyTools es una herramienta interna de gestión para el negocio. Corre como servidor local
            (Flask + SQLite) en esta máquina e incluye: Arqueo de Caja, Control de Ventas (Fibra óptica),
            Enlaces útiles y esta Configuración general (sucursales, empleados y clima).
          </div>
          <div class="stats" id="infoStats"></div>
          <div class="hint" id="infoPath" style="margin-top:12px;"></div>
        </div>

      </div>
    </div>
  `;

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const $ = (id) => root.querySelector('#'+id);
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('dashboard'));

    let sucursales = [];
    let empleados = [];
    let planes = [];

    // ---------- General: sucursales ----------
    async function loadSucursales(){
      sucursales = await api('/api/sucursales');
      renderSucursales();
    }
    function renderSucursales(){
      $('cfgSucursales').innerHTML = sucursales.length
        ? sucursales.map(s => `
            <div class="cfg-item">
              <span>${escapeHtml(s.nombre)}</span>
              <span class="cfg-meta">${[s.codigoInterno, s.direccion].filter(Boolean).map(escapeHtml).join(' · ')}</span>
              <button class="cfg-del" data-id="${escapeAttr(s.id)}" title="Quitar">&times;</button>
            </div>
          `).join('')
        : `<div class="cfg-empty">Sin sucursales cargadas todavía.</div>`;
      $('cfgSucursales').querySelectorAll('.cfg-del').forEach(btn => {
        btn.addEventListener('click', () => removeSucursal(btn.dataset.id));
      });
    }
    async function removeSucursal(id){
      await api(`/api/sucursales/${id}`, { method:'DELETE' });
      await loadSucursales();
    }
    async function addSucursal(){
      const nombreInput = $('cfgSucNombre');
      const codigoInput = $('cfgSucCodigo');
      const direccionInput = $('cfgSucDireccion');
      const nombre = nombreInput.value.trim();
      if(!nombre) return;
      await api('/api/sucursales', { method:'POST', body: {
        nombre, codigoInterno: codigoInput.value.trim(), direccion: direccionInput.value.trim(),
      }});
      nombreInput.value = ''; codigoInput.value = ''; direccionInput.value = '';
      await loadSucursales();
    }
    $('cfgSucAddBtn').addEventListener('click', addSucursal);
    ['cfgSucNombre','cfgSucCodigo','cfgSucDireccion'].forEach(id => {
      $(id).addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); addSucursal(); } });
    });

    // ---------- General: empleados ----------
    async function loadEmpleados(){
      empleados = await api('/api/empleados');
      renderEmpleados();
    }
    function renderEmpleados(){
      $('cfgEmpleados').innerHTML = empleados.length
        ? empleados.map(e => `
            <div class="cfg-item">
              <span>${escapeHtml([e.nombre, e.apellido].filter(Boolean).join(' '))}</span>
              <span class="cfg-meta">${[e.dni, e.telefono, e.email, e.codigoInterno].filter(Boolean).map(escapeHtml).join(' · ')}</span>
              <button class="cfg-del" data-id="${escapeAttr(e.id)}" title="Quitar">&times;</button>
            </div>
          `).join('')
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
      const nombreInput = $('cfgEmpNombre');
      const apellidoInput = $('cfgEmpApellido');
      const dniInput = $('cfgEmpDni');
      const telefonoInput = $('cfgEmpTelefono');
      const emailInput = $('cfgEmpEmail');
      const codigoInput = $('cfgEmpCodigo');
      const nombre = capitalizeWords(nombreInput.value.trim());
      const apellido = capitalizeWords(apellidoInput.value.trim());
      if(!nombre) return;
      await api('/api/empleados', { method:'POST', body: {
        nombre, apellido, dni: dniInput.value.trim(), telefono: telefonoInput.value.trim(),
        email: emailInput.value.trim(), codigoInterno: codigoInput.value.trim(),
      }});
      nombreInput.value=''; apellidoInput.value=''; dniInput.value='';
      telefonoInput.value=''; emailInput.value=''; codigoInput.value='';
      await loadEmpleados();
    }
    $('cfgEmpAddBtn').addEventListener('click', addEmpleado);
    ['cfgEmpNombre','cfgEmpApellido','cfgEmpDni','cfgEmpTelefono','cfgEmpEmail','cfgEmpCodigo'].forEach(id => {
      $(id).addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); addEmpleado(); } });
    });

    // ---------- Clima: unidades + ciudad ----------
    async function loadClima(){
      const cfg = await api('/api/config');
      $('cfgCiudad').value = cfg.clima_ciudad || '';
      $('cfgUnidadTemp').value = cfg.clima_unidad_temp || 'C';
      $('cfgUnidadPresion').value = cfg.clima_unidad_presion || 'hPa';
    }
    async function saveClima(){
      const payload = {
        clima_ciudad: $('cfgCiudad').value.trim(),
        clima_unidad_temp: $('cfgUnidadTemp').value,
        clima_unidad_presion: $('cfgUnidadPresion').value,
      };
      await api('/api/config', { method:'PUT', body: payload });
      if(window.App3Shell) window.App3Shell.refreshHeader();
      const note = $('climaSavedNote');
      note.textContent = 'Guardado ✓';
      setTimeout(() => { note.textContent = ''; }, 2000);
    }
    $('saveClimaBtn').addEventListener('click', saveClima);

    // ---------- Arqueo de caja: importar/exportar ----------
    $('arqueoExportBtn').addEventListener('click', () => {
      window.location.href = '/api/arqueo/export.xlsx';
    });
    $('arqueoImportBtn').addEventListener('click', () => $('arqueoImportInput').click());
    $('arqueoImportInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      try{
        const fd = new FormData();
        fd.append('file', file);
        const result = await api('/api/arqueo/import-excel', { method:'POST', body: fd });
        loadInfo();
        alert(`Importación completa: ${result.added} arqueos nuevos cargados.`);
      }catch(err){
        console.error(err);
        alert('No se pudo importar el archivo. Tiene que tener las mismas columnas que genera "Exportar Excel".');
      }
      e.target.value = '';
    });

    // ---------- Control de ventas / Fibra óptica: importar/exportar ----------
    $('fibraExportBtn').addEventListener('click', () => {
      window.location.href = '/api/fibra/export.xlsx';
    });
    $('fibraImportBtn').addEventListener('click', () => $('fibraImportInput').click());
    $('fibraImportInput').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      try{
        const fd = new FormData();
        fd.append('file', file);
        const result = await api('/api/fibra/import-excel', { method:'POST', body: fd });
        await loadPlanes();
        loadInfo();
        alert(`Importación completa: ${result.added} ventas nuevas cargadas.` + (result.added ? ' Los vendedores y planes nuevos que traía el Excel se agregaron solos a la lista.' : ''));
      }catch(err){
        console.error(err);
        alert('No se pudo importar el archivo. Tiene que tener las mismas columnas que genera "Exportar Excel" (los nombres de encabezado deben coincidir; el orden no importa).');
      }
      e.target.value = '';
    });

    // ---------- Control de ventas / Fibra óptica: planes ----------
    async function loadPlanes(){
      planes = await api('/api/fibra/planes');
      renderPlanes();
    }
    function renderPlanes(){
      $('cfgPlanes').innerHTML = planes.length
        ? planes.map(p => `<div class="cfg-item"><span>${p.mb} MB</span><button class="cfg-del" data-id="${escapeAttr(p.id)}" title="Quitar">&times;</button></div>`).join('')
        : `<div class="cfg-empty">Sin planes cargados todavía.</div>`;
      $('cfgPlanes').querySelectorAll('.cfg-del').forEach(btn => {
        btn.addEventListener('click', () => removePlan(btn.dataset.id));
      });
    }
    async function removePlan(id){
      await api(`/api/fibra/planes/${id}`, { method:'DELETE' });
      await loadPlanes();
    }
    async function addPlan(){
      const input = $('cfgPlanInput');
      const val = Number(input.value);
      if(!val || val <= 0) return;
      if(planes.some(p => p.mb === val)){ input.value = ''; return; }
      await api('/api/fibra/planes', { method:'POST', body: { mb: val } });
      input.value = '';
      await loadPlanes();
    }
    $('cfgPlanAddBtn').addEventListener('click', addPlan);
    $('cfgPlanInput').addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); addPlan(); } });

    // ---------- Acerca de esta instalación ----------
    async function loadInfo(){
      const info = await api('/api/config/info');
      $('infoStats').innerHTML = Object.entries(info.counts).map(([key, n]) => `
        <div class="stat"><div class="n">${n}</div><div class="l">${escapeHtml(COUNT_LABELS[key] || key)}</div></div>
      `).join('');
      $('infoPath').textContent = `Base de datos: ${info.dbPath} (${info.dbSizeKb} KB)`;
    }

    loadSucursales();
    loadEmpleados();
    loadClima();
    loadPlanes();
    loadInfo();
  }

  function unmount(){}

  return { mount, unmount };
})();
