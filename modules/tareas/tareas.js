// MyTools - modulo Tareas (seguimiento de tareas internas con avances y prioridad)
window.TareasModule = (function(){
  const { escapeHtml, escapeAttr, api, moduleIcon, isoToDisplayDate, parseDateToIso, attachDateMask } = window.App3;

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Inicio</button>
      <div class="head">
        <div class="brand">
          ${moduleIcon('tareas', 'mod-icon')}
          <div>
            <h1>Tareas</h1>
            <div class="sub">Seguimiento de tareas y avances</div>
          </div>
        </div>
        <div class="stats" id="stats"></div>
      </div>

      <div class="fiber-line"></div>

      <div class="toolbar">
        <div class="spacer"></div>
        <button class="btn" id="newBtn">+ Nueva tarea</button>
      </div>

      <div class="tareas-list" id="tareasList"></div>
      <div class="empty" id="emptyState" style="display:none;">
        <div class="big">No hay tareas cargadas</div>
        <div>Usá "Nueva tarea" para empezar.</div>
      </div>
    </div>

    <div class="overlay" id="overlay">
      <div class="modal narrow">
        <div class="modal-head">
          <h2>Nueva tarea</h2>
          <button class="close" id="closeBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="grid">
            <div class="field full">
              <label>Título <span class="req">*</span></label>
              <input type="text" id="f_titulo" placeholder="Ej: Renovar contrato de internet">
              <div class="err" id="err_titulo"></div>
            </div>
            <div class="field">
              <label>Fecha máxima</label>
              <div class="date-field">
                <input type="text" id="f_fechaLimite" placeholder="dd/mm/aaaa">
                <button type="button" class="date-pick-btn" id="f_fechaLimite_pickBtn" title="Elegir del calendario" aria-label="Elegir fecha del calendario">📅</button>
                <input type="date" id="f_fechaLimite_native" class="date-native" tabindex="-1" aria-hidden="true">
              </div>
              <div class="err" id="err_fechaLimite"></div>
            </div>
            <div class="field">
              <label>&nbsp;</label>
              <div class="checkbox-row"><input type="checkbox" id="f_prioritaria"><span>Marcar como prioritaria</span></div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <div class="left"></div>
          <div class="right">
            <button class="btn secondary" id="cancelBtn">Cancelar</button>
            <button class="btn" id="saveBtn">Crear tarea</button>
          </div>
        </div>
      </div>
    </div>

    <div class="overlay" id="historyOverlay">
      <div class="modal narrow">
        <div class="modal-head">
          <h2 id="historyTitle">Historial de avances</h2>
          <button class="close" id="historyCloseBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="tarea-comment-list" id="historyList"></div>
        </div>
      </div>
    </div>
  `;

  let escHandler = null;

  function mount(root, ctx){
    root.innerHTML = TEMPLATE;
    const $ = (id) => root.querySelector('#'+id);
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('dashboard'));

    let tareas = [];

    async function loadTareas(){
      tareas = await api('/api/tareas');
      render();
    }

    // ---------- Formato ----------
    function fmtFechaHora(ts){
      if(!ts) return '';
      const d = new Date(ts);
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yy = String(d.getFullYear()).slice(-2);
      const hh = String(d.getHours()).padStart(2,'0');
      const mi = String(d.getMinutes()).padStart(2,'0');
      return `${dd}/${mm}/${yy} ${hh}:${mi}`;
    }

    // ---------- Render ----------
    function updateStats(){
      const abiertas = tareas.filter(t => t.estado !== 'cerrada').length;
      const prioritarias = tareas.filter(t => t.estado !== 'cerrada' && t.prioritaria).length;
      $('stats').innerHTML = `
        <div class="stat"><div class="n">${abiertas}</div><div class="l">Abiertas</div></div>
        <div class="stat"><div class="n">${prioritarias}</div><div class="l">Prioritarias</div></div>
      `;
    }

    function comentarioHtml(c){
      return `
        <div class="tarea-comment">
          <div class="tarea-comment-text">${escapeHtml(c.texto)}</div>
          <div class="tarea-comment-ts">${fmtFechaHora(c.createdAt)}</div>
        </div>
      `;
    }

    function tareaCardHtml(t){
      const cerrada = t.estado === 'cerrada';
      const classes = ['tarea-card'];
      if(t.prioritaria) classes.push('priority');
      if(cerrada) classes.push('closed');

      const metaParts = [`Creada ${fmtFechaHora(t.createdAt)}`];
      if(t.fechaLimite) metaParts.push(`Vence ${isoToDisplayDate(t.fechaLimite)}`);
      let metaHtml = metaParts.join(' · ');
      if(cerrada) metaHtml += ` · <span class="tarea-closed-badge">Cerrada ${fmtFechaHora(t.closedAt)}</span>`;

      const comentariosHtml = t.comentarios.length
        ? t.comentarios.map(comentarioHtml).join('')
        : `<div class="cfg-empty">Todavía no hay avances cargados.</div>`;

      const verTodos = t.comentariosCount > t.comentarios.length
        ? `<button class="tarea-ver-todos" data-id="${escapeAttr(t.id)}" data-titulo="${escapeAttr(t.titulo)}">Ver los ${t.comentariosCount} avances</button>`
        : '';

      const acciones = !cerrada ? `
        <div class="tarea-add-comment">
          <input type="text" class="tarea-comment-input" data-id="${escapeAttr(t.id)}" placeholder="Agregar un avance...">
          <button class="btn secondary small tarea-comment-btn" data-id="${escapeAttr(t.id)}">Comentar</button>
        </div>
        <div class="tarea-actions">
          <button class="btn secondary small tarea-priority-btn" data-id="${escapeAttr(t.id)}">${t.prioritaria ? 'Quitar prioridad' : 'Marcar prioritaria'}</button>
          <button class="btn secondary small tarea-close-btn" data-id="${escapeAttr(t.id)}">Cerrar tarea</button>
        </div>
      ` : `
        <div class="tarea-actions">
          <button class="btn secondary small tarea-reopen-btn" data-id="${escapeAttr(t.id)}">Reabrir tarea</button>
        </div>
      `;

      return `
        <div class="${classes.join(' ')}">
          ${t.prioritaria ? '<span class="tarea-priority-badge">Prioritaria</span>' : ''}
          <div class="tarea-card-head">
            <h3 class="tarea-title">${escapeHtml(t.titulo)}</h3>
            <div class="tarea-meta">${metaHtml}</div>
          </div>
          <div class="tarea-comments">${comentariosHtml}</div>
          ${verTodos}
          ${acciones}
        </div>
      `;
    }

    function render(){
      updateStats();
      $('tareasList').innerHTML = tareas.map(tareaCardHtml).join('');
      $('emptyState').style.display = tareas.length ? 'none' : 'block';
      attachCardHandlers();
    }

    function attachCardHandlers(){
      root.querySelectorAll('.tarea-priority-btn').forEach(btn => {
        btn.addEventListener('click', () => togglePrioridad(btn.dataset.id));
      });
      root.querySelectorAll('.tarea-close-btn').forEach(btn => {
        btn.addEventListener('click', () => cerrarTarea(btn.dataset.id));
      });
      root.querySelectorAll('.tarea-reopen-btn').forEach(btn => {
        btn.addEventListener('click', () => reabrirTarea(btn.dataset.id));
      });
      root.querySelectorAll('.tarea-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => addComentario(btn.dataset.id));
      });
      root.querySelectorAll('.tarea-comment-input').forEach(input => {
        input.addEventListener('keydown', (e) => { if(e.key === 'Enter'){ e.preventDefault(); addComentario(input.dataset.id); } });
      });
      root.querySelectorAll('.tarea-ver-todos').forEach(btn => {
        btn.addEventListener('click', () => openHistory(btn.dataset.id, btn.dataset.titulo));
      });
    }

    async function togglePrioridad(id){
      await api(`/api/tareas/${id}/prioridad`, { method:'PUT' });
      await loadTareas();
    }

    async function cerrarTarea(id){
      if(!confirm('¿Cerrar esta tarea? No vas a poder agregar más avances después.')) return;
      await api(`/api/tareas/${id}/cerrar`, { method:'POST' });
      await loadTareas();
    }

    async function reabrirTarea(id){
      await api(`/api/tareas/${id}/reabrir`, { method:'POST' });
      await loadTareas();
    }

    async function addComentario(id){
      const input = root.querySelector(`.tarea-comment-input[data-id="${id}"]`);
      const texto = input.value.trim();
      if(!texto) return;
      await api(`/api/tareas/${id}/comentarios`, { method:'POST', body: { texto } });
      await loadTareas();
    }

    // ---------- Historial completo ----------
    async function openHistory(id, titulo){
      $('historyTitle').textContent = `Historial de avances · ${titulo}`;
      $('historyList').innerHTML = '<div class="cfg-empty">Cargando…</div>';
      $('historyOverlay').classList.add('open');
      try{
        const comentarios = await api(`/api/tareas/${id}/comentarios`);
        $('historyList').innerHTML = comentarios.length
          ? comentarios.map(comentarioHtml).join('')
          : '<div class="cfg-empty">Sin avances cargados.</div>';
      }catch(e){
        $('historyList').innerHTML = '<div class="cfg-empty">No se pudo cargar el historial.</div>';
      }
    }
    function closeHistory(){ $('historyOverlay').classList.remove('open'); }

    // ---------- Nueva tarea ----------
    function openNew(){
      $('f_titulo').value = '';
      $('f_fechaLimite').value = '';
      $('f_prioritaria').checked = false;
      $('err_titulo').textContent = '';
      $('err_fechaLimite').textContent = '';
      $('overlay').classList.add('open');
      $('f_titulo').focus();
    }

    function closeModal(){ $('overlay').classList.remove('open'); }

    function requestCloseModal(){
      const hasContent = $('f_titulo').value.trim() || $('f_fechaLimite').value.trim() || $('f_prioritaria').checked;
      if(hasContent && !confirm('¿Desea cerrar? Se perderá lo cargado')) return;
      closeModal();
    }

    function validate(){
      let ok = true;
      const titulo = $('f_titulo').value.trim();
      if(!titulo){ $('err_titulo').textContent = 'Requerido'; ok = false; }
      else { $('err_titulo').textContent = ''; }
      const fechaVal = $('f_fechaLimite').value.trim();
      if(fechaVal && !parseDateToIso(fechaVal)){ $('err_fechaLimite').textContent = 'Fecha inválida (dd/mm/aaaa)'; ok = false; }
      else { $('err_fechaLimite').textContent = ''; }
      return ok;
    }

    async function saveForm(){
      if(!validate()) return;
      const fechaVal = $('f_fechaLimite').value.trim();
      const payload = {
        titulo: $('f_titulo').value.trim(),
        fechaLimite: fechaVal ? parseDateToIso(fechaVal) : '',
        prioritaria: $('f_prioritaria').checked,
      };
      await api('/api/tareas', { method:'POST', body: payload });
      closeModal();
      await loadTareas();
    }

    // ---------- Fecha maxima: mascara + calendario nativo ----------
    attachDateMask($('f_fechaLimite'));
    $('f_fechaLimite').addEventListener('blur', () => {
      const val = $('f_fechaLimite').value.trim();
      $('err_fechaLimite').textContent = (val && !parseDateToIso(val)) ? 'Fecha inválida (dd/mm/aaaa)' : '';
    });
    $('f_fechaLimite_pickBtn').addEventListener('click', () => {
      const nativeEl = $('f_fechaLimite_native');
      nativeEl.value = parseDateToIso($('f_fechaLimite').value) || '';
      if(typeof nativeEl.showPicker === 'function'){
        try{ nativeEl.showPicker(); }catch(e){ nativeEl.focus(); }
      } else { nativeEl.focus(); }
    });
    $('f_fechaLimite_native').addEventListener('change', () => {
      const nativeEl = $('f_fechaLimite_native');
      if(!nativeEl.value) return;
      $('f_fechaLimite').value = isoToDisplayDate(nativeEl.value);
    });

    $('newBtn').addEventListener('click', openNew);
    $('closeBtn').addEventListener('click', requestCloseModal);
    $('cancelBtn').addEventListener('click', requestCloseModal);
    $('saveBtn').addEventListener('click', saveForm);
    // Click afuera del modal no cierra nada (evita perder progreso sin querer).

    $('historyCloseBtn').addEventListener('click', closeHistory);
    $('historyOverlay').addEventListener('click', (e) => { if(e.target.id === 'historyOverlay') closeHistory(); });

    escHandler = (e) => {
      if(e.key !== 'Escape') return;
      if($('overlay').classList.contains('open')) requestCloseModal();
      else if($('historyOverlay').classList.contains('open')) closeHistory();
    };
    document.addEventListener('keydown', escHandler);

    loadTareas();
  }

  function unmount(){
    if(escHandler){ document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  return { mount, unmount };
})();
