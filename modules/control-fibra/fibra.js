// MyTools - modulo Control de Fibra (portado desde control-fibra.html, persistencia via /api/fibra/*)
window.FibraModule = (function(){
  const { escapeHtml, escapeAttr, capitalizeWords, todayStr, api, moduleIcon, isoToDisplayDate, parseDateToIso, attachDateMask } = window.App3;

  const FIELD_IDS = ['vendedor','fechaIngreso','plan','cantidadTV','fechaPactada','franjaPactada','ot','sds',
    'fechaInstalacion','estado','observaciones','clienteNombre','dni','fechaNacimiento','email','telefono','telefonoAlt',
    'localidad','calle','altura','entreCalles','tipoDomicilio','torrePisoDepto'];
  const DATE_KEYS = new Set(['fechaIngreso','fechaPactada','fechaInstalacion','fechaNacimiento']);
  const ESTADOS = ['Deuda','HP','Falta pactar','Pactada','Cancelada','Instalada'];

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Control de Ventas</button>
      <div class="banner" id="formBanner">
        <span class="icon">⚠</span>
        <span>Atención, hay ventas que no están cargadas en el formulario</span>
        <span class="spacer"></span>
        <button class="bclose" id="formBannerClose">&times;</button>
      </div>

      <div class="head">
        <div class="brand">
          ${moduleIcon('fibra', 'mod-icon')}
          <div>
            <h1>Fibra óptica</h1>
            <div class="sub">Registro de gestiones de venta e instalación</div>
          </div>
        </div>
        <div class="stats" id="stats"></div>
      </div>

      <div class="fiber-line"></div>

      <div class="month-heading" id="monthHeading"></div>

      <div class="toolbar">
        <input type="text" id="search" placeholder="Buscar por cliente, vendedor, DNI, OT, SDS o domicilio…">
        <select id="filterEstado">
          <option value="">Todos los estados</option>
          <option value="Deuda">Deuda</option>
          <option value="HP">HP</option>
          <option value="Falta pactar">Falta pactar</option>
          <option value="Pactada">Pactada</option>
          <option value="Cancelada">Cancelada</option>
          <option value="Instalada">Instalada</option>
        </select>
        <div class="spacer"></div>
        <button class="btn secondary" id="statsBtn">Estadísticas</button>
        <button class="btn" id="newBtn">+ Nueva venta</button>
      </div>

      <div class="table-wrap">
        <table id="table">
          <thead>
            <tr>
              <th></th>
              <th style="text-align:center">Ingreso</th>
              <th>Vendedor</th>
              <th>Titular</th>
              <th>Domicilio</th>
              <th style="text-align:center">Plan</th>
              <th style="text-align:center">TV</th>
              <th style="text-align:center">Pactada</th>
              <th style="text-align:center">OT</th>
              <th style="text-align:center">SDS</th>
              <th style="text-align:center">Estado</th>
              <th style="text-align:center">Instalación</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
        <div class="empty" id="emptyState" style="display:none;">
          <div class="big">No hay ventas cargadas para este mes</div>
          <div>Usá "Nueva venta" o cambiá de mes con las flechas de abajo.</div>
        </div>
      </div>

      <div class="month-nav">
        <button class="btn secondary small" id="prevMonthBtn">‹ Mes anterior</button>
        <span class="lbl" id="monthNavLbl"></span>
        <button class="btn secondary small" id="nextMonthBtn">Mes siguiente ›</button>
      </div>
    </div>

    <div class="overlay" id="overlay">
      <div class="modal">
        <div class="modal-head">
          <h2 id="modalTitle">Detalle de venta</h2>
          <button class="close" id="closeBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div id="viewBody"></div>
          <form id="form" style="display:none;">
            <div class="section-title">Datos generales</div>
            <div class="grid">
              <div class="field"><label>Fecha de ingreso <span class="req">*</span></label>
                <div class="date-field">
                  <input type="text" id="f_fechaIngreso">
                  <button type="button" class="date-pick-btn" id="f_fechaIngreso_pickBtn" title="Elegir del calendario" aria-label="Elegir fecha del calendario">📅</button>
                  <input type="date" id="f_fechaIngreso_native" class="date-native" tabindex="-1" aria-hidden="true">
                </div>
              <div class="err" id="err_fechaIngreso"></div></div>
              <div class="field"><label>Vendedor <span class="req">*</span></label><select id="f_vendedor"></select><div class="err" id="err_vendedor"></div></div>
              <div class="field full">
                <label>Con formulario</label>
                <div class="checkbox-row"><input type="checkbox" id="f_conForm"><span>Cargado en el formulario</span></div>
              </div>
            </div>

            <div class="section-title">Datos del domicilio</div>
            <div class="grid cols-3">
              <div class="field"><label>Localidad <span class="req">*</span></label><input type="text" id="f_localidad" data-cap="words"><div class="err" id="err_localidad"></div></div>
              <div class="field"><label>Calle <span class="req">*</span></label><input type="text" id="f_calle" data-cap="words"><div class="err" id="err_calle"></div></div>
              <div class="field"><label>Altura <span class="req">*</span></label><input type="text" id="f_altura" inputmode="numeric"><div class="err" id="err_altura"></div></div>
              <div class="field"><label>Entre calles</label><input type="text" id="f_entreCalles" data-cap="words"><div class="err"></div></div>
              <div class="field"><label>Torre, piso y departamento</label><input type="text" id="f_torrePisoDepto" data-cap="words"><div class="err"></div></div>
              <div class="field"><label>Tipo <span class="req">*</span></label>
                <select id="f_tipoDomicilio"><option value="">- Seleccionar -</option><option>Casa</option><option>Edificio</option><option>Pasillo</option><option>Empresa</option></select>
                <div class="err" id="err_tipoDomicilio"></div>
              </div>
            </div>

            <div class="section-title">Datos del titular</div>
            <div class="grid">
              <div class="field"><label>Nombre <span class="req">*</span></label><input type="text" id="f_clienteNombre" data-cap="words"><div class="err" id="err_clienteNombre"></div></div>
              <div class="field"><label>DNI / CUIT <span class="req">*</span></label><input type="text" id="f_dni" class="mono" inputmode="numeric"><div class="err" id="err_dni"></div></div>
              <div class="field"><label>Fecha de nacimiento</label>
                <div class="date-field">
                  <input type="text" id="f_fechaNacimiento">
                  <button type="button" class="date-pick-btn" id="f_fechaNacimiento_pickBtn" title="Elegir del calendario" aria-label="Elegir fecha del calendario">📅</button>
                  <input type="date" id="f_fechaNacimiento_native" class="date-native" tabindex="-1" aria-hidden="true">
                </div>
              <div class="err" id="err_fechaNacimiento"></div></div>
              <div class="field"><label>Mail</label><input type="text" id="f_email"><div class="err" id="err_email"></div></div>
              <div class="field"><label>Teléfono <span class="req">*</span></label><input type="text" id="f_telefono" inputmode="tel"><div class="err" id="err_telefono"></div></div>
              <div class="field"><label>Alternativo</label><input type="text" id="f_telefonoAlt" inputmode="tel"><div class="err"></div></div>
            </div>

            <div class="section-title">Datos del servicio</div>
            <div class="grid">
              <div class="field"><label>Plan de internet</label><select id="f_plan"></select><div class="err"></div></div>
              <div class="field"><label>Cantidad de TV</label>
                <select id="f_cantidadTV"><option value="">- Seleccionar -</option><option value="0">N/A</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>
                <div class="err"></div>
              </div>
            </div>

            <div class="section-title">Datos de la gestión</div>
            <div class="grid">
              <div class="field"><label>Fecha pactada</label>
                <div class="date-field">
                  <input type="text" id="f_fechaPactada">
                  <button type="button" class="date-pick-btn" id="f_fechaPactada_pickBtn" title="Elegir del calendario" aria-label="Elegir fecha del calendario">📅</button>
                  <input type="date" id="f_fechaPactada_native" class="date-native" tabindex="-1" aria-hidden="true">
                </div>
              <div class="err" id="err_fechaPactada"></div></div>
              <div class="field"><label>Franja pactada</label>
                <select id="f_franjaPactada"><option value="">- Seleccionar -</option><option value="AM">AM</option><option value="PM">PM</option></select>
                <div class="err"></div>
              </div>
              <div class="field"><label>Código de OT</label><input type="text" id="f_ot" class="mono"><div class="err" id="err_ot"></div></div>
              <div class="field"><label>Código de SDS</label><input type="text" id="f_sds" class="mono"><div class="err" id="err_sds"></div></div>
              <div class="field"><label>Fecha real de instalación</label>
                <div class="date-field">
                  <input type="text" id="f_fechaInstalacion">
                  <button type="button" class="date-pick-btn" id="f_fechaInstalacion_pickBtn" title="Elegir del calendario" aria-label="Elegir fecha del calendario">📅</button>
                  <input type="date" id="f_fechaInstalacion_native" class="date-native" tabindex="-1" aria-hidden="true">
                </div>
              <div class="err" id="err_fechaInstalacion"></div></div>
              <div class="field"><label>Estado</label>
                <select id="f_estado">
                  <option value="">- Seleccionar -</option>
                  <option>Deuda</option><option>HP</option><option>Falta pactar</option>
                  <option>Pactada</option><option>Cancelada</option><option>Instalada</option>
                </select>
                <div class="err"></div>
              </div>
            </div>
            <div class="field full" style="margin-top:12px;">
              <label>Observaciones</label>
              <textarea id="f_observaciones" rows="3"></textarea>
              <div class="err"></div>
            </div>
          </form>
        </div>
        <div class="modal-foot" id="viewFooter">
          <div class="left"><button class="btn secondary" id="viewDeleteBtn" style="color:var(--red);border-color:#e3c2bf;">Eliminar</button></div>
          <div class="right">
            <button class="btn secondary" id="viewCloseBtn">Cerrar</button>
            <button class="btn" id="viewEditBtn">Editar</button>
          </div>
        </div>
        <div class="modal-foot" id="editFooter" style="display:none;">
          <div class="left"></div>
          <div class="right">
            <span class="meta-note" id="metaNote"></span>
            <button class="btn secondary" id="cancelBtn">Cancelar</button>
            <button class="btn" id="saveBtn">Guardar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay" id="statsOverlay">
      <div class="modal narrow">
        <div class="modal-head">
          <h2>Estadísticas</h2>
          <button class="close" id="statsCloseBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="month-nav" style="padding-top:0;">
            <button class="btn secondary small" id="statsPrevBtn">‹</button>
            <span class="lbl" id="statsMonthLbl"></span>
            <button class="btn secondary small" id="statsNextBtn">›</button>
          </div>
          <div class="section-title">Totales del mes</div>
          <div class="stats hero-stats-2" id="statsTotales"></div>
          <div class="section-title">Por vendedor</div>
          <div class="table-wrap" id="statsVendedorBody"></div>
        </div>
        <div class="modal-foot">
          <div class="left"></div>
          <div class="right"><button class="btn secondary" id="statsCloseBtn2">Cerrar</button></div>
        </div>
      </div>
    </div>
  `;

  let escHandler = null;

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const $ = (id) => root.querySelector('#'+id);
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('ventas'));

    function validateDateField(id){
      const el = $('f_'+id);
      if(!el.value) return; // vacio: lo maneja validate() al guardar (Requerido)
      const errEl = $('err_'+id);
      const invalid = !parseDateToIso(el.value);
      if(errEl) errEl.textContent = invalid ? 'Fecha inválida (dd/mm/aaaa)' : '';
      el.classList.toggle('invalid', invalid);
    }

    DATE_KEYS.forEach(id => {
      const el = $('f_'+id);
      attachDateMask(el);
      el.addEventListener('blur', () => validateDateField(id));

      const nativeEl = $('f_'+id+'_native');
      const pickBtn = $('f_'+id+'_pickBtn');
      pickBtn.addEventListener('click', () => {
        nativeEl.value = parseDateToIso(el.value) || '';
        if(typeof nativeEl.showPicker === 'function'){
          try{ nativeEl.showPicker(); }catch(e){ nativeEl.focus(); }
        } else {
          nativeEl.focus();
        }
      });
      nativeEl.addEventListener('change', () => {
        if(!nativeEl.value) return;
        el.value = isoToDisplayDate(nativeEl.value);
        validateDateField(id);
      });
    });

    let ventas = [];
    let empleados = []; // [{id, nombre, rol}] - se usan como opciones de "vendedor"
    let planes = [];     // [{id, mb}]
    let editingId = null;
    let currentMonth = (function(){ const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
    let statsMonth = null;
    let bannerDismissed = false;

    const overlay = $('overlay');
    const statsOverlay = $('statsOverlay');

    function activeVentas(){ return ventas; } // el server ya filtra eliminado=0

    async function loadData(){
      [ventas, empleados, planes] = await Promise.all([
        api('/api/fibra/ventas'),
        api('/api/empleados'),
        api('/api/fibra/planes'),
      ]);
      render();
    }

    // ---------- Selects de vendedor y plan en el formulario de venta ----------
    function populateVendedorSelect(currentValue){
      const el = $('f_vendedor');
      const opts = ['<option value="">- Seleccionar -</option>'];
      const nombres = empleados.map(v => v.nombre);
      if(currentValue && !nombres.includes(currentValue)){
        opts.push(`<option value="${escapeAttr(currentValue)}">${escapeHtml(currentValue)} (no listado)</option>`);
      }
      nombres.forEach(v => opts.push(`<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`));
      el.innerHTML = opts.join('');
      el.value = currentValue || '';
    }
    function populatePlanSelect(currentValue){
      const el = $('f_plan');
      const cur = currentValue ? String(currentValue) : '';
      const opts = ['<option value="">- Seleccionar -</option>'];
      const mbs = planes.map(p => String(p.mb));
      if(cur && !mbs.includes(cur)){
        opts.push(`<option value="${escapeAttr(cur)}">${escapeHtml(cur)} MB (no listado)</option>`);
      }
      mbs.forEach(mb => opts.push(`<option value="${mb}">${mb} MB</option>`));
      el.innerHTML = opts.join('');
      el.value = cur;
    }

    // ---------- Fechas / formato ----------
    function fmtDate(d){
      if(!d) return '';
      const [y,m,day] = d.split('-');
      return `${day}/${m}/${y.slice(2)}`;
    }
    function fmtDateOrDash(d){ return fmtDate(d) || '—'; }
    function fmtTV(n){ return (!n || n === '0') ? 'N/A' : String(n); }
    function fmtTs(ts){
      if(!ts) return '';
      const d = new Date(ts);
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yy = String(d.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
    }
    const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    function monthKeyOf(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
    function monthLabelLong(d){ return `Ventas de ${MESES[d.getMonth()]} ${d.getFullYear()}`; }
    function monthLabelShort(d){ return `${MESES[d.getMonth()]} ${d.getFullYear()}`; }

    function estadoClass(e){
      return (e||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,'-');
    }

    // ---------- Estadísticas (cabecera) y filtros ----------
    function monthFiltered(){
      const key = monthKeyOf(currentMonth);
      return activeVentas().filter(v => (v.fechaIngreso||'').slice(0,7) === key);
    }

    function renderStats(){
      const base = monthFiltered();
      const total = base.length;
      const sinPactar = base.filter(v => v.estado === 'Falta pactar').length;
      const pactadas = base.filter(v => v.estado === 'Pactada').length;
      const instaladas = base.filter(v => v.estado === 'Instalada').length;
      const canceladas = base.filter(v => v.estado === 'Cancelada').length;
      $('stats').innerHTML = `
        <div class="stat"><div class="n">${total}</div><div class="l">Total del mes</div></div>
        <div class="stat"><div class="n">${sinPactar}</div><div class="l">Sin pactar</div></div>
        <div class="stat"><div class="n">${pactadas}</div><div class="l">Pactadas</div></div>
        <div class="stat"><div class="n">${instaladas}</div><div class="l">Instaladas</div></div>
        <div class="stat"><div class="n">${canceladas}</div><div class="l">Canceladas</div></div>
      `;
    }

    function matchesFilters(v){
      const q = $('search').value.trim().toLowerCase();
      const estadoF = $('filterEstado').value;
      if(estadoF && v.estado !== estadoF) return false;
      if(!q) return true;
      const hay = [v.vendedor, v.clienteNombre, v.dni, v.ot, v.sds, v.calle, v.localidad, v.entreCalles].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    }

    function checkFormBanner(){
      const missing = activeVentas().some(v => !v.conForm);
      $('formBanner').classList.toggle('show', missing && !bannerDismissed);
    }

    function render(){
      $('monthHeading').textContent = monthLabelLong(currentMonth);
      $('monthNavLbl').textContent = monthLabelShort(currentMonth);
      renderStats();
      checkFormBanner();

      const rows = monthFiltered()
        .filter(matchesFilters)
        .sort((a,b) => (b.fechaIngreso||'').localeCompare(a.fechaIngreso||'') || (a.orden||0) - (b.orden||0) || (a.createdAt||0) - (b.createdAt||0));

      const tbody = $('tbody');
      tbody.innerHTML = '';
      $('emptyState').style.display = rows.length ? 'none' : 'block';

      for(const v of rows){
        const tr = document.createElement('tr');
        tr.draggable = true;
        tr.dataset.id = v.id;
        tr.dataset.fecha = v.fechaIngreso || '';
        const domicilio = v.calle ? `${escapeHtml(v.calle)}${v.altura ? ' ' + escapeHtml(v.altura) : ''}` : '—';
        const domicilioSub = [v.localidad ? escapeHtml(v.localidad) : '', v.entreCalles ? 'e/ ' + escapeHtml(v.entreCalles) : '']
          .filter(Boolean).join(' · ');
        const formFlag = v.conForm ? '' : '<span class="form-flag" title="Falta cargar en el formulario">⚠</span>';
        tr.innerHTML = `
          <td class="drag-handle" title="Arrastrar para reordenar dentro del mismo día">⠿</td>
          <td style="text-align:center">${fmtDateOrDash(v.fechaIngreso)}</td>
          <td>${escapeHtml(v.vendedor || '—')}</td>
          <td class="cliente-cell">
            <div class="nombre">${escapeHtml(v.clienteNombre || '—')}</div>
            <div class="dni">${escapeHtml(v.dni || '')}</div>
          </td>
          <td class="domicilio-cell">
            <div class="calle">${domicilio}</div>
            <div class="entre">${domicilioSub}</div>
          </td>
          <td style="text-align:center">${v.plan ? escapeHtml(v.plan) + ' MB' : '—'}</td>
          <td style="text-align:center"><span class="tv-badge">${fmtTV(v.cantidadTV)}</span></td>
          <td style="text-align:center">${fmtDateOrDash(v.fechaPactada)} ${v.franjaPactada ? '· '+v.franjaPactada : ''}</td>
          <td class="code" style="text-align:center">${escapeHtml(v.ot || '—')}</td>
          <td class="code" style="text-align:center">${escapeHtml(v.sds || '—')}</td>
          <td style="text-align:center"><span class="pill ${estadoClass(v.estado)}">${escapeHtml(v.estado || 'Falta pactar')}</span>${formFlag}</td>
          <td style="text-align:center">${fmtDateOrDash(v.fechaInstalacion)}</td>
        `;
        tr.addEventListener('click', () => { if(!tr.dataset.wasDrag) openView(v.id); });
        tbody.appendChild(tr);
      }
      attachRowDnD();
    }

    function attachRowDnD(){
      let dragId = null;
      let dragFecha = null;
      const tbody = $('tbody');
      tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('dragstart', (e) => {
          dragId = tr.dataset.id;
          dragFecha = tr.dataset.fecha;
          tr.dataset.wasDrag = '';
          tr.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
        });
        tr.addEventListener('dragend', () => {
          tr.classList.remove('dragging');
          tbody.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
          setTimeout(() => { delete tr.dataset.wasDrag; }, 50);
        });
        tr.addEventListener('dragover', (e) => {
          if(!dragId || dragId === tr.dataset.id) return;
          if(tr.dataset.fecha !== dragFecha) return;
          e.preventDefault();
          tr.classList.add('drop-target');
        });
        tr.addEventListener('dragleave', () => tr.classList.remove('drop-target'));
        tr.addEventListener('drop', async (e) => {
          e.preventDefault();
          tr.classList.remove('drop-target');
          const targetId = tr.dataset.id;
          if(!dragId || dragId === targetId) return;
          await api('/api/fibra/ventas/reorder', { method:'PUT', body: { dragId, targetId } });
          ventas = await api('/api/fibra/ventas');
          render();
        });
      });
    }

    $('prevMonthBtn').addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1);
      render();
    });
    $('nextMonthBtn').addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1);
      render();
    });
    $('formBannerClose').addEventListener('click', () => {
      bannerDismissed = true;
      $('formBanner').classList.remove('show');
    });

    // ---------- Estadísticas por mes (modal) ----------
    function openStats(){
      statsMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      renderStatsModal();
      statsOverlay.classList.add('open');
    }
    function closeStats(){ statsOverlay.classList.remove('open'); }

    function renderStatsModal(){
      $('statsMonthLbl').textContent = monthLabelShort(statsMonth);
      const key = monthKeyOf(statsMonth);
      const base = activeVentas().filter(v => (v.fechaIngreso||'').slice(0,7) === key);
      const total = base.length;
      const porEstado = {};
      ESTADOS.forEach(e => porEstado[e] = base.filter(v => v.estado === e).length);

      $('statsTotales').innerHTML = `
        <div class="stat"><div class="n">${porEstado['Falta pactar']}</div><div class="l">Sin pactar</div></div>
        <div class="stat"><div class="n">${porEstado['Pactada']}</div><div class="l">Pactadas</div></div>
        <div class="stat"><div class="n">${porEstado['Instalada']}</div><div class="l">Instaladas</div></div>
        <div class="stat"><div class="n">${porEstado['Cancelada']}</div><div class="l">Canceladas</div></div>
        <div class="stat"><div class="n">${total}</div><div class="l">Total ventas</div></div>
      `;

      const porVendedor = {};
      base.forEach(v => {
        const nombre = v.vendedor || '— Sin vendedor —';
        if(!porVendedor[nombre]) porVendedor[nombre] = { total: 0, instaladas: 0 };
        porVendedor[nombre].total++;
        if(v.estado === 'Instalada') porVendedor[nombre].instaladas++;
      });
      const filas = Object.entries(porVendedor).sort((a,b) => b[1].total - a[1].total);

      $('statsVendedorBody').innerHTML = filas.length ? `
        <table>
          <thead><tr><th>Vendedor</th><th>Ventas</th><th>% del mes</th><th>Instaladas</th></tr></thead>
          <tbody>
            ${filas.map(([nombre, d]) => `
              <tr>
                <td>${escapeHtml(nombre)}</td>
                <td>${d.total}</td>
                <td>${total ? Math.round(d.total/total*100) : 0}%</td>
                <td>${d.instaladas}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty" style="padding:24px;">Sin ventas cargadas este mes</div>`;
    }

    $('statsPrevBtn').addEventListener('click', () => {
      statsMonth = new Date(statsMonth.getFullYear(), statsMonth.getMonth()-1, 1);
      renderStatsModal();
    });
    $('statsNextBtn').addEventListener('click', () => {
      statsMonth = new Date(statsMonth.getFullYear(), statsMonth.getMonth()+1, 1);
      renderStatsModal();
    });
    $('statsBtn').addEventListener('click', openStats);
    $('statsCloseBtn').addEventListener('click', closeStats);
    $('statsCloseBtn2').addEventListener('click', closeStats);
    statsOverlay.addEventListener('click', (e) => { if(e.target === statsOverlay) closeStats(); });

    // ---------- Vista de detalle (con copiar) ----------
    function vField(label, value){
      const v = (value === undefined || value === null) ? '' : String(value);
      const empty = !v;
      const display = empty ? '—' : escapeHtml(v);
      return `<div class="vfield">
        <div class="vlabel">${label}</div>
        <div class="vrow">
          <div class="vvalue ${empty?'empty':''}">${display}</div>
          <button type="button" class="copy-btn${empty?' is-empty':''}" data-value="${empty?'':escapeAttr(v)}" title="Copiar">⧉</button>
        </div>
      </div>`;
    }

    function buildViewHtml(v){
      return `
        <div class="section-title">Datos generales</div>
        <div class="vgrid">
          ${vField('Fecha de ingreso', fmtDate(v.fechaIngreso))}
          ${vField('Vendedor', v.vendedor)}
          ${vField('Con formulario', v.conForm ? 'Sí' : 'No')}
        </div>
        <div class="section-title">Datos del domicilio</div>
        <div class="vgrid">
          ${vField('Localidad', v.localidad)}
          ${vField('Calle', v.calle)}
          ${vField('Altura', v.altura)}
          ${vField('Entre calles', v.entreCalles)}
          ${vField('Torre, piso y depto', v.torrePisoDepto)}
          ${vField('Tipo', v.tipoDomicilio)}
        </div>
        <div class="section-title">Datos del titular</div>
        <div class="vgrid">
          ${vField('Nombre', v.clienteNombre)}
          ${vField('DNI / CUIT', v.dni)}
          ${vField('Fecha de nacimiento', fmtDate(v.fechaNacimiento))}
          ${vField('Mail', v.email)}
          ${vField('Teléfono', v.telefono)}
          ${vField('Alternativo', v.telefonoAlt)}
        </div>
        <div class="section-title">Datos del servicio</div>
        <div class="vgrid">
          ${vField('Plan (MB)', v.plan)}
          ${vField('Cantidad de TV', fmtTV(v.cantidadTV))}
        </div>
        <div class="section-title">Datos de la gestión</div>
        <div class="vgrid">
          ${vField('Fecha pactada', fmtDate(v.fechaPactada))}
          ${vField('Franja pactada', v.franjaPactada)}
          ${vField('Código de OT', v.ot)}
          ${vField('Código de SDS', v.sds)}
          ${vField('Fecha real de instalación', fmtDate(v.fechaInstalacion))}
          ${vField('Estado', v.estado)}
        </div>
        <div class="vgrid"><div class="vfield full">${vField('Observaciones', v.observaciones)}</div></div>
      `;
    }

    function attachCopyHandlers(){
      $('viewBody').querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const val = btn.dataset.value;
          if(!val) return;
          try{
            await navigator.clipboard.writeText(val);
            btn.classList.add('copied');
            const prev = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => { btn.classList.remove('copied'); btn.textContent = prev; }, 1100);
          }catch(e){ /* portapapeles bloqueado, ignorar */ }
        });
      });
    }

    function openView(id){
      editingId = id;
      const v = ventas.find(x => x.id === id);
      if(!v) return;
      $('modalTitle').textContent = 'Detalle de venta';
      $('viewBody').innerHTML = buildViewHtml(v);
      $('viewBody').style.display = 'block';
      $('form').style.display = 'none';
      $('viewFooter').style.display = 'flex';
      $('editFooter').style.display = 'none';
      attachCopyHandlers();
      overlay.classList.add('open');
    }

    function switchToEdit(){
      const v = ventas.find(x => x.id === editingId);
      if(!v) return;
      populateVendedorSelect(v.vendedor);
      populatePlanSelect(v.plan);
      clearForm();
      fillForm(v);
      $('modalTitle').textContent = 'Editar venta';
      $('viewBody').style.display = 'none';
      $('form').style.display = 'block';
      $('viewFooter').style.display = 'none';
      $('editFooter').style.display = 'flex';
      $('metaNote').textContent = v.updatedAt ? `Últ. edición: ${fmtTs(v.updatedAt)}` : '';
    }

    function openNew(){
      editingId = null;
      populateVendedorSelect('');
      populatePlanSelect('');
      clearForm();
      $('modalTitle').textContent = 'Nueva venta';
      $('viewBody').style.display = 'none';
      $('form').style.display = 'block';
      $('viewFooter').style.display = 'none';
      $('editFooter').style.display = 'flex';
      $('metaNote').textContent = '';
      overlay.classList.add('open');
      $('f_vendedor').focus();
    }

    function closeModal(){
      overlay.classList.remove('open');
      editingId = null;
    }

    function requestCloseModal(){
      const inForm = $('form').style.display !== 'none';
      if(inForm && !confirm('¿Desea cerrar? Se perderá todo el progreso')) return;
      closeModal();
    }

    // ---------- Formulario ----------
    function clearForm(){
      for(const id of FIELD_IDS){
        const el = $('f_'+id);
        if(!el) continue;
        if(id === 'fechaIngreso') el.value = isoToDisplayDate(todayStr());
        else if(DATE_KEYS.has(id)) el.value = '';
        else el.value = '';
      }
      $('f_conForm').checked = false;
      root.querySelectorAll('.err').forEach(e => e.textContent = '');
      root.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    }

    function fillForm(v){
      for(const id of FIELD_IDS){
        const el = $('f_'+id);
        if(!el) continue;
        el.value = DATE_KEYS.has(id) ? isoToDisplayDate(v[id]) : (v[id] ?? '');
      }
      $('f_conForm').checked = !!v.conForm;
    }

    function readForm(){
      const data = {};
      for(const id of FIELD_IDS){ data[id] = $('f_'+id).value.trim(); }
      data.conForm = $('f_conForm').checked;
      return data;
    }

    function validate(data){
      let ok = true;
      const setErr = (field, msg) => {
        const errEl = $('err_'+field);
        const inputEl = $('f_'+field);
        if(errEl) errEl.textContent = msg || '';
        if(inputEl) inputEl.classList.toggle('invalid', !!msg);
        if(msg) ok = false;
      };
      const dateErr = (field, requiredMsg) => {
        if(!data[field]) return requiredMsg || '';
        return parseDateToIso(data[field]) ? '' : 'Fecha inválida (dd/mm/aaaa)';
      };
      setErr('vendedor', !data.vendedor ? 'Requerido' : '');
      setErr('fechaIngreso', dateErr('fechaIngreso', 'Requerida'));
      setErr('clienteNombre', !data.clienteNombre ? 'Requerido' : '');
      setErr('localidad', !data.localidad ? 'Requerido' : '');
      setErr('calle', !data.calle ? 'Requerido' : '');
      setErr('altura', !data.altura ? 'Requerido' : '');
      setErr('tipoDomicilio', !data.tipoDomicilio ? 'Requerido' : '');
      const isoIngreso = parseDateToIso(data.fechaIngreso);
      const isoPactada = parseDateToIso(data.fechaPactada);
      const isoInstalacion = parseDateToIso(data.fechaInstalacion);

      const pactadaRequerida = data.estado === 'Pactada' || data.estado === 'Instalada';
      let fechaPactadaMsg = dateErr('fechaPactada', pactadaRequerida ? 'Requerida si el estado es Pactada o Instalada' : '');
      if(!fechaPactadaMsg && isoPactada && isoIngreso && isoPactada < isoIngreso){
        fechaPactadaMsg = 'Debe ser igual o posterior a la fecha de ingreso';
      }
      setErr('fechaPactada', fechaPactadaMsg);

      let fechaInstalacionMsg = dateErr('fechaInstalacion', data.estado === 'Instalada' ? 'Requerida si el estado es Instalada' : '');
      if(!fechaInstalacionMsg && isoInstalacion && isoPactada && isoInstalacion < isoPactada){
        fechaInstalacionMsg = 'Debe ser igual o posterior a la fecha pactada';
      }
      setErr('fechaInstalacion', fechaInstalacionMsg);

      setErr('fechaNacimiento', dateErr('fechaNacimiento', ''));
      setErr('ot', (data.estado === 'Instalada' && !data.ot) ? 'Requerido si el estado es Instalada' : '');
      setErr('sds', (data.estado === 'Instalada' && !data.sds) ? 'Requerido si el estado es Instalada' : '');
      if(!data.dni){
        setErr('dni', 'Requerido');
      } else {
        const digits = data.dni.replace(/\D/g,'');
        setErr('dni', (digits.length < 7 || digits.length > 11) ? 'DNI/CUIT inválido' : '');
      }
      if(data.email){
        setErr('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? '' : 'Mail inválido');
      } else { setErr('email',''); }
      if(!data.telefono){
        setErr('telefono', 'Requerido');
      } else {
        const digits = data.telefono.replace(/\D/g,'');
        setErr('telefono', digits.length < 8 ? 'Teléfono inválido' : '');
      }
      return ok;
    }

    async function saveForm(){
      const data = readForm();
      if(!validate(data)) return;

      DATE_KEYS.forEach(id => { data[id] = data[id] ? parseDateToIso(data[id]) : ''; });

      data.clienteNombre = capitalizeWords(data.clienteNombre);
      data.calle = capitalizeWords(data.calle);
      data.localidad = capitalizeWords(data.localidad);
      data.entreCalles = capitalizeWords(data.entreCalles);
      data.torrePisoDepto = capitalizeWords(data.torrePisoDepto);
      data.ot = data.ot.toUpperCase();
      data.sds = data.sds.toUpperCase();
      data.email = data.email.toLowerCase();

      if(editingId){
        await api(`/api/fibra/ventas/${editingId}`, { method:'PUT', body: data });
      } else {
        await api('/api/fibra/ventas', { method:'POST', body: data });
      }
      await loadData();
      closeModal();
    }

    async function deleteEntry(){
      if(!editingId) return;
      if(!confirm('¿Eliminar esta gestión? Se va a quitar de la lista pero se conserva en la base.')) return;
      await api(`/api/fibra/ventas/${editingId}`, { method:'DELETE' });
      await loadData();
      closeModal();
    }

    root.querySelectorAll('[data-cap="words"]').forEach(el => {
      el.addEventListener('blur', () => { el.value = capitalizeWords(el.value); });
    });
    $('f_ot').addEventListener('blur', () => { $('f_ot').value = $('f_ot').value.toUpperCase(); });
    $('f_sds').addEventListener('blur', () => { $('f_sds').value = $('f_sds').value.toUpperCase(); });
    $('f_email').addEventListener('blur', () => { $('f_email').value = $('f_email').value.toLowerCase(); });

    $('newBtn').addEventListener('click', openNew);
    $('closeBtn').addEventListener('click', requestCloseModal);
    $('viewCloseBtn').addEventListener('click', closeModal);
    $('viewEditBtn').addEventListener('click', switchToEdit);
    $('viewDeleteBtn').addEventListener('click', deleteEntry);
    $('cancelBtn').addEventListener('click', requestCloseModal);
    $('saveBtn').addEventListener('click', saveForm);
    // Click afuera del modal no cierra nada (evita perder progreso sin querer).

    escHandler = (e) => {
      if(e.key !== 'Escape') return;
      if(overlay.classList.contains('open')) requestCloseModal();
      else if(statsOverlay.classList.contains('open')) closeStats();
    };
    document.addEventListener('keydown', escHandler);

    $('search').addEventListener('input', render);
    $('filterEstado').addEventListener('change', render);

    loadData();
  }

  function unmount(){
    if(escHandler){ document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  return { mount, unmount };
})();
