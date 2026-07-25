// MyTools - modulo Configuracion (ajustes generales de la app, organizados por seccion)
window.ConfiguracionModule = (function(){
  const { escapeHtml, escapeAttr, api, moduleIcon } = window.App3;

  const COUNT_LABELS = {
    empleados: 'Empleados', arqueos: 'Arqueos',
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
        <div class="section-title">General</div>
        <div class="grid">
          <div class="field full"><label>Localidad</label><input type="text" id="cfgCiudad" placeholder="Rosario"></div>
        </div>
        <div class="hint" style="margin-bottom:18px;">
          Se usa para mostrar el clima actual en el encabezado. Necesita conexión a internet — si no hay,
          el encabezado va a mostrar "Clima no disponible".
        </div>
        <button class="btn" id="saveBtn">Guardar cambios</button>
        <span class="meta-note" id="savedNote" style="margin-left:10px;"></span>
        <div class="hint" style="margin-top:14px;">Los empleados (usados también como vendedores en Control de Ventas) se gestionan desde "Sucursal y Empleados".</div>

        <div class="section-title" style="margin-top:32px;">Arqueo de caja</div>
        <input type="file" id="arqueoImportInput" accept=".xlsx,.xls" style="display:none;">
        <div class="cfg-data-actions">
          <button class="btn secondary small" id="arqueoImportBtn">Importar Excel</button>
          <button class="btn secondary small" id="arqueoExportBtn">Exportar Excel</button>
        </div>

        <div class="section-title" style="margin-top:32px;">Control de ventas</div>
        <div style="font-size:13px;font-weight:700;color:var(--text);margin:2px 0 14px;">Fibra óptica</div>

        <label style="display:block;font-size:11.5px;color:var(--text-dim);font-weight:500;margin-bottom:6px;">Planes de internet (MB)</label>
        <div class="cfg-list" id="cfgPlanes"></div>
        <div class="cfg-add">
          <input type="number" id="cfgPlanInput" min="0" step="1" placeholder="Ej: 300">
          <button class="btn secondary small" id="cfgPlanAddBtn">Agregar</button>
        </div>
        <div class="hint" style="margin:10px 0 16px;">Más adelante se van a poder asociar precios a cada plan.</div>

        <input type="file" id="fibraImportInput" accept=".xlsx,.xls" style="display:none;">
        <div class="cfg-data-actions">
          <button class="btn secondary small" id="fibraImportBtn">Importar Excel</button>
          <button class="btn secondary small" id="fibraExportBtn">Exportar Excel</button>
        </div>

        <div class="section-title" style="margin-top:32px;">Acerca de esta instalación</div>
        <div class="stats" id="infoStats"></div>
        <div class="hint" id="infoPath" style="margin-top:10px;"></div>
      </div>
    </div>
  `;

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const $ = (id) => root.querySelector('#'+id);
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('dashboard'));

    let planes = [];

    // ---------- General: localidad ----------
    async function loadConfig(){
      const cfg = await api('/api/config');
      $('cfgCiudad').value = cfg.clima_ciudad || '';
    }

    async function save(){
      const payload = { clima_ciudad: $('cfgCiudad').value.trim() };
      await api('/api/config', { method:'PUT', body: payload });
      if(window.App3Shell) window.App3Shell.refreshHeader();
      const note = $('savedNote');
      note.textContent = 'Guardado ✓';
      setTimeout(() => { note.textContent = ''; }, 2000);
    }
    $('saveBtn').addEventListener('click', save);

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

    // ---------- Acerca de esta instalación ----------
    async function loadInfo(){
      const info = await api('/api/config/info');
      $('infoStats').innerHTML = Object.entries(info.counts).map(([key, n]) => `
        <div class="stat"><div class="n">${n}</div><div class="l">${escapeHtml(COUNT_LABELS[key] || key)}</div></div>
      `).join('');
      $('infoPath').textContent = `Base de datos: ${info.dbPath} (${info.dbSizeKb} KB)`;
    }

    loadConfig();
    loadPlanes();
    loadInfo();
  }

  function unmount(){}

  return { mount, unmount };
})();
