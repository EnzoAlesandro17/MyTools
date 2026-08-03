// MyTools - modulo Horarios (grilla semanal: empleados x dias).
// Cada semana es independiente - no hay plantilla general, se carga entera
// semana a semana. Cada dia se asigna eligiendo entre horarios predeterminados,
// Licencia, Franco, u Otros (texto libre).
window.HorariosModule = (function(){
  const { escapeHtml, escapeAttr, api, moduleIcon } = window.App3;

  const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

  const PRESETS = [
    { horaInicio:'10:00', horaFin:'18:00' },
    { horaInicio:'13:00', horaFin:'21:00' },
    { horaInicio:'10:00', horaFin:'16:00' },
    { horaInicio:'15:00', horaFin:'21:00' },
    { horaInicio:'11:00', horaFin:'21:00' },
  ];

  // ---------- Helpers de semana (ISO 8601, lunes a domingo) ----------
  function mondayOf(d){
    const dow = d.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
  }
  function addDays(d, n){ return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function isoWeekKey(d){
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - dayNum + 3);
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
    const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
    const week = 1 + Math.round((date - firstThursday) / (7*24*3600*1000));
    return `${date.getUTCFullYear()}-W${String(week).padStart(2,'0')}`;
  }
  function fmtRangoSemana(monday){
    const sunday = addDays(monday, 6);
    const f = (x) => `${String(x.getDate()).padStart(2,'0')}/${String(x.getMonth()+1).padStart(2,'0')}`;
    return `${f(monday)} – ${f(sunday)}`;
  }

  const SELECT_OPTIONS = `
    <option value="">Elegir…</option>
    ${PRESETS.map((p,i) => `<option value="p${i}">${p.horaInicio} a ${p.horaFin}</option>`).join('')}
    <option value="licencia">Licencia</option>
    <option value="franco">Franco</option>
    <option value="otro">Otros (Escribir)</option>
  `;

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Inicio</button>
      <div class="head">
        <div class="brand">
          ${moduleIcon('horarios', 'mod-icon')}
          <div>
            <h1>Horarios</h1>
            <div class="sub">Carga semanal - cada semana es independiente</div>
          </div>
        </div>
        <div class="stats" id="stats"></div>
      </div>

      <div class="fiber-line"></div>

      <div class="toolbar" style="flex-wrap:wrap;gap:8px;">
        <button class="btn secondary small" id="semanaPrevBtn">‹</button>
        <span id="semanaLabel" style="min-width:150px;text-align:center;font-weight:600;"></span>
        <button class="btn secondary small" id="semanaNextBtn">›</button>
        <button class="btn secondary small" id="semanaHoyBtn">Semana actual</button>
        <div class="spacer"></div>
        <button class="btn secondary small" id="gestionarEmpBtn">Gestionar empleados</button>
      </div>

      <div class="table-wrap">
        <table id="table">
          <thead>
            <tr id="tableHead"></tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
        <div class="empty" id="emptyState" style="display:none;">
          <div class="big">No hay empleados visibles en esta grilla</div>
          <div>Usá "Gestionar empleados" para sumarlos.</div>
        </div>
      </div>
    </div>

    <div class="overlay" id="overlay">
      <div class="modal narrow">
        <div class="modal-head">
          <h2 id="modalTitle">Horario</h2>
          <button class="close" id="closeBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="grid">
            <div class="field full">
              <label>Horario <span class="req">*</span></label>
              <select id="f_tipo">${SELECT_OPTIONS}</select>
              <div class="err" id="err_tipo"></div>
            </div>
            <div class="field full" id="rowOtro" style="display:none;">
              <label>Detalle</label>
              <input type="text" id="f_nota" placeholder="Ej: 10:00-14:00 y 16:00-20:00">
              <div class="err" id="err_nota"></div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <div class="left"><button class="btn secondary" id="clearBtn" style="color:var(--red);border-color:#e3c2bf;display:none;">Quitar</button></div>
          <div class="right">
            <button class="btn secondary" id="cancelBtn">Cancelar</button>
            <button class="btn" id="saveBtn">Guardar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay" id="empOverlay">
      <div class="modal narrow">
        <div class="modal-head">
          <h2>Empleados en la grilla</h2>
          <button class="close" id="empCloseBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="hint" style="margin-bottom:12px;">Destildá a quien no deba tener horario acá (ej. un supervisor). El orden de la lista es el orden en la grilla.</div>
          <div class="cfg-list" id="empList"></div>
        </div>
        <div class="modal-foot">
          <div class="left"></div>
          <div class="right">
            <button class="btn secondary" id="empCancelBtn">Cancelar</button>
            <button class="btn" id="empSaveBtn">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  let escHandler = null;

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const $ = (id) => root.querySelector('#'+id);
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('dashboard'));

    let empleados = [];
    let horarios = []; // solo de la semana actualmente mostrada
    let empConfig = []; // [{empleadoId, orden, visible}]
    let semanaMonday = mondayOf(new Date());
    let current = null; // { empId, dia }
    let localEmpConfig = [];

    const overlay = $('overlay');
    const empOverlay = $('empOverlay');

    function weekKey(){ return isoWeekKey(semanaMonday); }

    async function loadSemana(){
      horarios = await api(`/api/horarios/semana/${weekKey()}`);
      render();
    }

    async function loadTodo(){
      [empleados, empConfig] = await Promise.all([api('/api/empleados'), api('/api/horarios/empleados')]);
      await loadSemana();
    }

    function empleadosVisibles(){
      const porId = new Map(empleados.map(e => [e.id, e]));
      return empConfig
        .filter(c => c.visible && porId.has(c.empleadoId))
        .sort((a,b) => a.orden - b.orden)
        .map(c => porId.get(c.empleadoId));
    }

    function entradaDe(empId, dia){
      return horarios.find(h => h.empleadoId === empId && h.diaSemana === dia) || null;
    }

    // ---------- Navegacion de semana ----------
    function renderSemanaLabel(){ $('semanaLabel').textContent = fmtRangoSemana(semanaMonday); }
    $('semanaPrevBtn').addEventListener('click', () => { semanaMonday = addDays(semanaMonday, -7); renderSemanaLabel(); loadSemana(); });
    $('semanaNextBtn').addEventListener('click', () => { semanaMonday = addDays(semanaMonday, 7); renderSemanaLabel(); loadSemana(); });
    $('semanaHoyBtn').addEventListener('click', () => { semanaMonday = mondayOf(new Date()); renderSemanaLabel(); loadSemana(); });

    // ---------- Render principal ----------
    function renderStats(){
      const empVis = empleadosVisibles();
      $('stats').innerHTML = `
        <div class="stat"><div class="n">${empVis.length}</div><div class="l">Empleados en la grilla</div></div>
        <div class="stat"><div class="n">${horarios.length}</div><div class="l">Días cargados esta semana</div></div>
      `;
    }
    function renderHead(){
      $('tableHead').innerHTML = `<th>Empleado</th>` + DIAS.map(d => `<th style="text-align:center;">${d}</th>`).join('');
    }
    function cellHtml(empId, dia){
      const h = entradaDe(empId, dia);
      let contenido;
      if(!h){
        contenido = `<span style="color:var(--muted,#999);">—</span>`;
      } else if(h.tipo === 'horario'){
        contenido = `<span>${escapeHtml(h.horaInicio)}–${escapeHtml(h.horaFin)}</span>`;
      } else if(h.tipo === 'licencia'){
        contenido = `<span style="color:#b8860b;font-style:italic;">Licencia</span>`;
      } else if(h.tipo === 'franco'){
        contenido = `<span style="color:var(--muted,#999);font-style:italic;">Franco</span>`;
      } else {
        contenido = `<span style="font-style:italic;">${escapeHtml(h.nota || 'Otro')}</span>`;
      }
      return `
        <td class="horario-cell" data-emp="${escapeAttr(empId)}" data-dia="${dia}" style="text-align:center;vertical-align:middle;padding:8px 6px;cursor:pointer;">
          ${contenido}
        </td>
      `;
    }
    function render(){
      renderStats();
      renderHead();
      const empVis = empleadosVisibles();
      $('emptyState').style.display = empVis.length ? 'none' : 'block';
      $('tbody').innerHTML = empVis.map(e => `
        <tr>
          <td style="white-space:nowrap;vertical-align:middle;padding:8px 6px;font-weight:600;">${escapeHtml([e.nombre, e.apellido].filter(Boolean).join(' '))}</td>
          ${DIAS.map((_, dia) => cellHtml(e.id, dia)).join('')}
        </tr>
      `).join('');
      $('tbody').querySelectorAll('.horario-cell').forEach(td => {
        td.addEventListener('click', () => openDia(td.dataset.emp, Number(td.dataset.dia)));
      });
    }

    // ---------- Modal de horario por dia ----------
    function clearErrors(){ root.querySelectorAll('#overlay .err').forEach(e => e.textContent = ''); }

    function toggleOtro(){
      $('rowOtro').style.display = $('f_tipo').value === 'otro' ? '' : 'none';
    }
    $('f_tipo').addEventListener('change', toggleOtro);

    function openDia(empId, dia){
      current = { empId, dia };
      clearErrors();
      const empleado = empleados.find(e => e.id === empId);
      const nombre = empleado ? [empleado.nombre, empleado.apellido].filter(Boolean).join(' ') : '';
      $('modalTitle').textContent = `${nombre} · ${DIAS[dia]} (semana ${fmtRangoSemana(semanaMonday)})`;

      const h = entradaDe(empId, dia);
      $('clearBtn').style.display = h ? 'inline-block' : 'none';
      $('f_nota').value = '';
      if(!h){
        $('f_tipo').value = '';
      } else if(h.tipo === 'horario'){
        const idx = PRESETS.findIndex(p => p.horaInicio === h.horaInicio && p.horaFin === h.horaFin);
        $('f_tipo').value = idx >= 0 ? `p${idx}` : 'otro';
        if(idx < 0) $('f_nota').value = `${h.horaInicio}–${h.horaFin}`;
      } else if(h.tipo === 'otro'){
        $('f_tipo').value = 'otro';
        $('f_nota').value = h.nota || '';
      } else {
        $('f_tipo').value = h.tipo; // licencia | franco
      }
      toggleOtro();
      overlay.classList.add('open');
    }

    function closeModal(){ overlay.classList.remove('open'); current = null; }

    function buildPayload(){
      clearErrors();
      const val = $('f_tipo').value;
      if(!val){ $('err_tipo').textContent = 'Elegí una opción'; return null; }
      if(val === 'licencia' || val === 'franco') return { tipo: val };
      if(val === 'otro'){
        const nota = $('f_nota').value.trim();
        if(!nota){ $('err_nota').textContent = 'Escribí un detalle'; return null; }
        return { tipo: 'otro', nota };
      }
      const p = PRESETS[Number(val.slice(1))];
      return { tipo: 'horario', horaInicio: p.horaInicio, horaFin: p.horaFin };
    }

    async function saveForm(){
      const payload = buildPayload();
      if(!payload) return;
      await api('/api/horarios/dia', { method:'PUT', body: {
        empleadoId: current.empId, diaSemana: current.dia, semana: weekKey(), ...payload,
      }});
      await loadSemana();
      closeModal();
    }

    async function clearDia(){
      if(!confirm('¿Quitar el horario de este día?')) return;
      await api(`/api/horarios/dia?empleadoId=${encodeURIComponent(current.empId)}&diaSemana=${current.dia}&semana=${encodeURIComponent(weekKey())}`, { method:'DELETE' });
      await loadSemana();
      closeModal();
    }

    $('closeBtn').addEventListener('click', closeModal);
    $('cancelBtn').addEventListener('click', closeModal);
    $('saveBtn').addEventListener('click', saveForm);
    $('clearBtn').addEventListener('click', clearDia);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });

    // ---------- Modal de gestion de empleados (orden + visibilidad) ----------
    function renderEmpList(){
      $('empList').innerHTML = localEmpConfig.map((c, i) => {
        const e = empleados.find(x => x.id === c.empleadoId);
        const nombre = e ? [e.nombre, e.apellido].filter(Boolean).join(' ') : '(empleado eliminado)';
        return `
          <div class="cfg-item" style="justify-content:space-between;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" class="emp-visible-chk" data-idx="${i}" ${c.visible ? 'checked' : ''}>
              <span>${escapeHtml(nombre)}</span>
            </label>
            <div style="display:flex;gap:4px;">
              <button class="btn secondary small emp-up-btn" data-idx="${i}" ${i === 0 ? 'disabled' : ''} title="Subir">↑</button>
              <button class="btn secondary small emp-down-btn" data-idx="${i}" ${i === localEmpConfig.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
            </div>
          </div>
        `;
      }).join('') || `<div class="cfg-empty">Sin empleados cargados en Configuración todavía.</div>`;

      $('empList').querySelectorAll('.emp-visible-chk').forEach(chk => {
        chk.addEventListener('change', () => { localEmpConfig[Number(chk.dataset.idx)].visible = chk.checked; });
      });
      $('empList').querySelectorAll('.emp-up-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.idx);
          if(i > 0){ [localEmpConfig[i-1], localEmpConfig[i]] = [localEmpConfig[i], localEmpConfig[i-1]]; renderEmpList(); }
        });
      });
      $('empList').querySelectorAll('.emp-down-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const i = Number(btn.dataset.idx);
          if(i < localEmpConfig.length - 1){ [localEmpConfig[i+1], localEmpConfig[i]] = [localEmpConfig[i], localEmpConfig[i+1]]; renderEmpList(); }
        });
      });
    }

    async function openGestionar(){
      empConfig = await api('/api/horarios/empleados'); // sincroniza altas nuevas del lado del servidor
      localEmpConfig = empConfig.map(c => ({ ...c }));
      renderEmpList();
      empOverlay.classList.add('open');
    }
    function closeGestionar(){ empOverlay.classList.remove('open'); }

    async function guardarGestionar(){
      const items = localEmpConfig.map((c, i) => ({ empleadoId: c.empleadoId, orden: i, visible: c.visible }));
      empConfig = await api('/api/horarios/empleados', { method:'PUT', body: { items } });
      closeGestionar();
      render();
    }

    $('gestionarEmpBtn').addEventListener('click', openGestionar);
    $('empCloseBtn').addEventListener('click', closeGestionar);
    $('empCancelBtn').addEventListener('click', closeGestionar);
    $('empSaveBtn').addEventListener('click', guardarGestionar);
    empOverlay.addEventListener('click', (e) => { if(e.target === empOverlay) closeGestionar(); });

    escHandler = (e) => {
      if(e.key !== 'Escape') return;
      if(overlay.classList.contains('open')) closeModal();
      else if(empOverlay.classList.contains('open')) closeGestionar();
    };
    document.addEventListener('keydown', escHandler);

    renderSemanaLabel();
    loadTodo();
  }

  function unmount(){
    if(escHandler){ document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  return { mount, unmount };
})();
