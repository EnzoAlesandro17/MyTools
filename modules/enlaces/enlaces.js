// MyTools - modulo Enlaces utiles (links y paginas de referencia)
window.EnlacesModule = (function(){
  const { escapeHtml, escapeAttr, api, moduleIcon } = window.App3;

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Inicio</button>
      <div class="head">
        <div class="brand">
          ${moduleIcon('enlaces', 'mod-icon')}
          <div>
            <h1>Enlaces útiles</h1>
            <div class="sub">Links y páginas de referencia guardadas</div>
          </div>
        </div>
        <div class="stats" id="stats"></div>
      </div>

      <div class="fiber-line"></div>

      <div class="toolbar">
        <input type="text" id="search" placeholder="Buscar por título, descripción o categoría…">
        <select id="filterCategoria">
          <option value="">Todas las categorías</option>
        </select>
        <div class="spacer"></div>
        <button class="btn" id="newBtn">+ Nuevo enlace</button>
      </div>

      <div class="table-wrap">
        <table id="table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
        <div class="empty" id="emptyState" style="display:none;">
          <div class="big">No hay enlaces guardados todavía</div>
          <div>Usá "Nuevo enlace" para agregar páginas y links útiles.</div>
        </div>
      </div>
    </div>

    <div class="overlay" id="overlay">
      <div class="modal narrow">
        <div class="modal-head">
          <h2 id="modalTitle">Nuevo enlace</h2>
          <button class="close" id="closeBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="grid">
            <div class="field full"><label>Título <span class="req">*</span></label><input type="text" id="f_titulo"><div class="err" id="err_titulo"></div></div>
            <div class="field full"><label>URL <span class="req">*</span></label><input type="text" id="f_url" class="mono" placeholder="https://…"><div class="err" id="err_url"></div></div>
            <div class="field full"><label>Categoría</label><input type="text" id="f_categoria" list="catOptions" placeholder="Ej: Proveedores, Trámites…"><datalist id="catOptions"></datalist><div class="err"></div></div>
            <div class="field full"><label>Descripción</label><textarea id="f_descripcion" rows="3"></textarea><div class="err"></div></div>
          </div>
        </div>
        <div class="modal-foot">
          <div class="left"><button class="btn secondary" id="deleteBtn" style="color:var(--red);border-color:#e3c2bf;display:none;">Eliminar</button></div>
          <div class="right">
            <button class="btn secondary" id="cancelBtn">Cancelar</button>
            <button class="btn" id="saveBtn">Guardar</button>
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

    let enlaces = [];
    let editingId = null;
    const overlay = $('overlay');

    async function loadData(){
      enlaces = await api('/api/enlaces');
      render();
    }

    function categorias(){
      return [...new Set(enlaces.map(e => e.categoria).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    }

    function populateFilterCategoria(){
      const el = $('filterCategoria');
      const cur = el.value;
      el.innerHTML = '<option value="">Todas las categorías</option>' +
        categorias().map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
      el.value = cur;
    }

    function populateCatDatalist(){
      $('catOptions').innerHTML = categorias().map(c => `<option value="${escapeAttr(c)}"></option>`).join('');
    }

    function matchesFilters(e){
      const q = $('search').value.trim().toLowerCase();
      const catF = $('filterCategoria').value;
      if(catF && e.categoria !== catF) return false;
      if(!q) return true;
      const hay = [e.titulo, e.descripcion, e.categoria].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    }

    function render(){
      $('stats').innerHTML = `<div class="stat"><div class="n">${enlaces.length}</div><div class="l">Enlaces guardados</div></div>`;
      populateFilterCategoria();
      populateCatDatalist();

      const rows = enlaces.filter(matchesFilters);
      const tbody = $('tbody');
      tbody.innerHTML = '';
      $('emptyState').style.display = rows.length ? 'none' : 'block';

      for(const e of rows){
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><a class="link-title" href="${escapeAttr(e.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(e.titulo)}</a></td>
          <td>${e.categoria ? `<span class="cat-badge">${escapeHtml(e.categoria)}</span>` : '—'}</td>
          <td class="desc-cell">${escapeHtml(e.descripcion || '—')}</td>
          <td>
            <div class="row-actions">
              <button class="btn secondary small" data-action="edit" data-id="${escapeAttr(e.id)}">Editar</button>
              <button class="btn secondary small" data-action="delete" data-id="${escapeAttr(e.id)}" style="color:var(--red);border-color:#e3c2bf;">Eliminar</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }
      tbody.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', () => openEdit(btn.dataset.id)));
      tbody.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => deleteEntry(btn.dataset.id)));
    }

    function clearForm(){
      $('f_titulo').value = '';
      $('f_url').value = '';
      $('f_categoria').value = '';
      $('f_descripcion').value = '';
      root.querySelectorAll('.err').forEach(e => e.textContent = '');
      root.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    }

    function openNew(){
      editingId = null;
      clearForm();
      $('modalTitle').textContent = 'Nuevo enlace';
      $('deleteBtn').style.display = 'none';
      overlay.classList.add('open');
      $('f_titulo').focus();
    }

    function openEdit(id){
      const e = enlaces.find(x => x.id === id);
      if(!e) return;
      editingId = id;
      clearForm();
      $('f_titulo').value = e.titulo;
      $('f_url').value = e.url;
      $('f_categoria').value = e.categoria || '';
      $('f_descripcion').value = e.descripcion || '';
      $('modalTitle').textContent = 'Editar enlace';
      $('deleteBtn').style.display = 'inline-block';
      overlay.classList.add('open');
    }

    function closeModal(){
      overlay.classList.remove('open');
      editingId = null;
    }

    function validate(){
      let ok = true;
      if(!$('f_titulo').value.trim()){ $('err_titulo').textContent = 'Requerido'; $('f_titulo').classList.add('invalid'); ok = false; }
      else { $('err_titulo').textContent = ''; $('f_titulo').classList.remove('invalid'); }
      if(!$('f_url').value.trim()){ $('err_url').textContent = 'Requerida'; $('f_url').classList.add('invalid'); ok = false; }
      else { $('err_url').textContent = ''; $('f_url').classList.remove('invalid'); }
      return ok;
    }

    async function saveForm(){
      if(!validate()) return;
      const payload = {
        titulo: $('f_titulo').value.trim(),
        url: $('f_url').value.trim(),
        categoria: $('f_categoria').value.trim(),
        descripcion: $('f_descripcion').value.trim(),
      };
      if(editingId){
        await api(`/api/enlaces/${editingId}`, { method:'PUT', body: payload });
      } else {
        await api('/api/enlaces', { method:'POST', body: payload });
      }
      await loadData();
      closeModal();
    }

    async function deleteEntry(id){
      if(!confirm('¿Eliminar este enlace?')) return;
      await api(`/api/enlaces/${id}`, { method:'DELETE' });
      await loadData();
    }

    $('newBtn').addEventListener('click', openNew);
    $('closeBtn').addEventListener('click', closeModal);
    $('cancelBtn').addEventListener('click', closeModal);
    $('saveBtn').addEventListener('click', saveForm);
    $('deleteBtn').addEventListener('click', () => { if(editingId) deleteEntry(editingId).then(closeModal); });
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
    $('search').addEventListener('input', render);
    $('filterCategoria').addEventListener('change', render);

    escHandler = (e) => { if(e.key === 'Escape' && overlay.classList.contains('open')) closeModal(); };
    document.addEventListener('keydown', escHandler);

    loadData();
  }

  function unmount(){
    if(escHandler){ document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  return { mount, unmount };
})();
