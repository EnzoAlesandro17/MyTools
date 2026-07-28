// MyTools - modulo Arqueo de Caja (portado desde arqueo-caja.html, persistencia via /api/arqueo/*)
window.ArqueoModule = (function(){
  const { escapeHtml, escapeAttr, fmtMoney, capitalizeWords, api, EPS, moduleIcon } = window.App3;

  const TEMPLATE = `
    <div class="wrap">
      <button class="back-home-btn" id="backHomeBtn">← Inicio</button>
      <div class="head">
        <div class="brand">
          ${moduleIcon('arqueo', 'mod-icon')}
          <div>
            <h1>Arqueo de Caja</h1>
            <div class="sub">Registro de arqueos por turno</div>
          </div>
        </div>
        <div class="stats" id="stats"></div>
      </div>

      <div class="fiber-line"></div>

      <div class="month-heading" id="monthHeading"></div>

      <div class="toolbar">
        <input type="text" id="search" placeholder="Buscar por empleado…">
        <select id="filterEmpleado">
          <option value="">Todos los empleados</option>
        </select>
        <div class="spacer"></div>
        <button class="btn secondary" id="statsBtn">Estadísticas</button>
        <button class="btn" id="newBtn">+ Nuevo arqueo</button>
      </div>

      <div class="table-wrap">
        <table id="table">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Empleados</th>
              <th style="text-align:right">Caja fuerte</th>
              <th style="text-align:right">Conteo caja</th>
              <th style="text-align:right">Saldo sistema</th>
              <th style="text-align:right">Variación</th>
              <th style="text-align:right">Resultado</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
        <div class="empty" id="emptyState" style="display:none;">
          <div class="big">No hay arqueos cargados para este mes</div>
          <div>Usá "Nuevo arqueo" o cambiá de mes con las flechas de abajo.</div>
        </div>
      </div>

      <div class="month-nav">
        <button class="btn secondary small" id="prevMonthBtn">‹ Mes anterior</button>
        <span class="lbl" id="monthNavLbl"></span>
        <button class="btn secondary small" id="nextMonthBtn">Mes siguiente ›</button>
      </div>
    </div>

    <div class="overlay" id="overlay">
      <div class="modal narrow">
        <div class="modal-head">
          <h2 id="modalTitle">Detalle de arqueo</h2>
          <button class="close" id="closeBtn">&times;</button>
        </div>
        <div class="modal-body">
          <div id="viewBody"></div>
          <form id="form" style="display:none;">
            <div class="section-title">Datos del arqueo</div>
            <div class="grid">
              <div class="field full"><label>Fecha y hora <span class="req">*</span></label><input type="datetime-local" id="f_fecha" step="1"><div class="err" id="err_fecha"></div></div>
              <div class="field full">
                <label>Empleados presentes <span class="req">*</span></label>
                <div class="emp-checks" id="f_empleados"></div>
                <div class="err" id="err_empleados"></div>
              </div>
            </div>
            <div class="section-title">Valores</div>
            <div class="grid">
              <div class="field full">
                <label>Caja fuerte (CF)</label>
                <input type="text" id="f_cf" class="mono" placeholder="Ej: 700.000 o +100.000+100.000">
                <div class="hint">Podés escribir una suma, ej: +100.000+100.000+2.000</div>
                <div class="hint" id="cfHint"></div>
                <div class="err"></div>
              </div>
              <div class="field full">
                <label>Conteo de caja (CC)</label>
                <input type="text" id="f_cc" class="mono" placeholder="Ej: +100.000+50.000+2.000+1.111">
                <div class="hint">Suma de todo lo contado en la caja del turno</div>
                <div class="err"></div>
              </div>
              <div class="field full">
                <label>Saldo sistema (SC)</label>
                <input type="text" id="f_sc" class="mono" placeholder="Ej: 307.221,43">
                <div class="hint">Lo que dice el sistema que debería haber</div>
                <div class="err"></div>
              </div>
            </div>
            <div class="result-box">
              <span class="lbl">Diferencia de este arqueo</span>
              <span class="val" id="f_resultado">$0,00</span>
            </div>
            <div class="result-box" style="margin-top:8px;background:transparent;">
              <span class="lbl" style="color:var(--text-faint);font-weight:500;">Acumulado total (arrastrado)</span>
              <span class="val" id="f_acumulado" style="font-size:13px;color:var(--text-faint);">$0,00</span>
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
          <div class="stats hero-stats" id="statsTotales"></div>
          <div class="section-title">Por empleado</div>
          <div class="table-wrap" id="statsEmpleadoBody"></div>
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
    if(ctx && ctx.goTo) $('backHomeBtn').addEventListener('click', () => ctx.goTo('dashboard'));

    let registros = [];
    let empleados = [];
    let editingId = null;
    let currentMonth = (function(){ const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
    let statsMonth = null;
    let lastAutoCf = null;

    const overlay = $('overlay');
    const statsOverlay = $('statsOverlay');

    function activeRegistros(){ return registros; } // el server ya filtra eliminado=0

    // ---------- Expresiones (CF / CC / SC) ----------
    // Formato argentino: "." separa miles (grupos de 3 digitos exactos), ","
    // es el separador decimal. Sin punto de miles cae al caso simple (numero
    // llano, coma decimal opcional) para no romper "700000" o "+100000+50000".
    const NUMBER_TOKEN_RE = /[+-]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[+-]?\d+(?:,\d+)?/g;
    function evalExpr(expr){
      if(expr === undefined || expr === null) return 0;
      const cleaned = String(expr).replace(/\s/g,'');
      if(!cleaned) return 0;
      const matches = cleaned.match(NUMBER_TOKEN_RE);
      if(!matches) return 0;
      return matches.reduce((sum, tok) => sum + parseFloat(tok.replace(/\./g,'').replace(',', '.')), 0);
    }
    function toField(expr){
      const e = (expr === undefined || expr === null || expr === '') ? '0' : String(expr).trim();
      return { expr: e, val: evalExpr(e) };
    }

    // ---------- Datos ----------
    async function loadData(){
      [registros, empleados] = await Promise.all([
        api('/api/arqueo/registros'),
        api('/api/empleados'),
      ]);
      render();
    }

    function populateFilterEmpleado(){
      const el = $('filterEmpleado');
      const cur = el.value;
      el.innerHTML = '<option value="">Todos los empleados</option>' +
        empleados.map(e => `<option value="${escapeAttr(e.nombre)}">${escapeHtml(e.nombre)}</option>`).join('');
      el.value = cur;
    }

    // ---------- Fechas ----------
    function isoToLocalInput(iso){
      if(!iso) return '';
      const m = String(iso).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})/);
      if(!m) return '';
      return `${m[1]}T${m[2]}:${m[3]}:${m[4]}`;
    }
    function inputToIso(val){
      if(!val) return '';
      let v = val;
      if(v.length === 16) v += ':00';
      return v + '.000000';
    }
    function nowLocalInput(){
      const d = new Date();
      const pad = (n) => String(n).padStart(2,'0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    function fmtFechaHora(iso){
      const m = String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
      if(!m) return '—';
      return `${m[3]}/${m[2]}/${m[1].slice(2)} ${m[4]}:${m[5]}`;
    }
    const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    function monthKeyOf(d){ return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); }
    function monthLabelLong(d){ return `Arqueos de ${MESES[d.getMonth()]} ${d.getFullYear()}`; }
    function monthLabelShort(d){ return `${MESES[d.getMonth()]} ${d.getFullYear()}`; }

    function resultClass(n){
      if(n > EPS) return 'sobra';
      if(n < -EPS) return 'falta';
      return 'cuadra';
    }
    function resultLabel(n){
      if(n > EPS) return `Sobra ${fmtMoney(n)}`;
      if(n < -EPS) return `Falta ${fmtMoney(Math.abs(n))}`;
      return 'Cuadra';
    }

    function sortedActiveByFecha(){
      return activeRegistros().slice().sort((a,b) => String(a.fecha||'').localeCompare(String(b.fecha||'')));
    }
    function deltaOf(r){
      const list = sortedActiveByFecha();
      const idx = list.findIndex(x => x.id === r.id);
      if(idx <= 0) return r.resultado || 0;
      return (r.resultado||0) - (list[idx-1].resultado||0);
    }

    function monthFiltered(){
      const key = monthKeyOf(currentMonth);
      return activeRegistros().filter(r => String(r.fecha||'').slice(0,7) === key);
    }

    function renderStats(){
      const base = monthFiltered();
      const total = base.length;
      const sumPropia = base.reduce((s,r) => s + deltaOf(r), 0);
      const sobras = base.filter(r => deltaOf(r) > EPS).length;
      const faltas = base.filter(r => deltaOf(r) < -EPS).length;
      const last = lastActiveRegistro();
      const lastVal = last ? (last.resultado||0) : 0;
      $('stats').innerHTML = `
        <div class="stat"><div class="n">${total}</div><div class="l">Arqueos del mes</div></div>
        <div class="stat"><div class="n ${sumPropia>EPS?'pos':sumPropia<-EPS?'neg':''}">${fmtMoney(sumPropia)}</div><div class="l">Balance mensual</div></div>
        <div class="stat"><div class="n">${sobras}</div><div class="l">Sobrantes</div></div>
        <div class="stat"><div class="n">${faltas}</div><div class="l">Faltantes</div></div>
        <div class="stat"><div class="n ${lastVal>EPS?'pos':lastVal<-EPS?'neg':''}">${last ? resultLabel(lastVal) : '—'}</div><div class="l">Resultado</div></div>
      `;
    }

    function lastActiveRegistro(excludeId){
      return activeRegistros()
        .filter(r => r.id !== excludeId)
        .slice()
        .sort((a,b) => String(b.fecha||'').localeCompare(String(a.fecha||'')))[0] || null;
    }

    function findPriorRegistro(fechaIso, excludeId){
      const list = activeRegistros().filter(r => r.id !== excludeId && (!fechaIso || String(r.fecha||'') < fechaIso));
      if(!list.length) return null;
      return list.slice().sort((a,b) => String(b.fecha||'').localeCompare(String(a.fecha||'')))[0];
    }

    function updateCfHint(prior){
      const el = $('cfHint');
      if(!el) return;
      if(!prior){
        el.textContent = 'No hay arqueos anteriores todavía — arranca en 0.';
        return;
      }
      const resultado = prior.resultado || 0;
      el.innerHTML = `Se precarga con la caja fuerte del arqueo anterior (${fmtFechaHora(prior.fecha)}, ${escapeHtml((prior.empleados||[]).join(', ')||'—')}) — su resultado fue <strong>${resultLabel(resultado)}</strong> y no se pierde, queda arrastrado.`;
    }

    function matchesFilters(r){
      const q = $('search').value.trim().toLowerCase();
      const empF = $('filterEmpleado').value;
      if(empF && !(r.empleados||[]).includes(empF)) return false;
      if(!q) return true;
      const hay = (r.empleados||[]).join(' ').toLowerCase();
      return hay.includes(q);
    }

    function render(){
      $('monthHeading').textContent = monthLabelLong(currentMonth);
      $('monthNavLbl').textContent = monthLabelShort(currentMonth);
      renderStats();
      populateFilterEmpleado();

      const rows = monthFiltered()
        .filter(matchesFilters)
        .sort((a,b) => String(b.fecha||'').localeCompare(String(a.fecha||'')));

      const tbody = $('tbody');
      tbody.innerHTML = '';
      $('emptyState').style.display = rows.length ? 'none' : 'block';

      for(const r of rows){
        const tr = document.createElement('tr');
        tr.dataset.id = r.id;
        const resultado = r.resultado || 0;
        const propia = deltaOf(r);
        tr.innerHTML = `
          <td>${fmtFechaHora(r.fecha)}</td>
          <td class="empleados-cell">${escapeHtml((r.empleados||[]).join(', ') || '—')}</td>
          <td class="num" style="text-align:right">${fmtMoney(r.cf ? r.cf.val : 0)}</td>
          <td class="num" style="text-align:right">${fmtMoney(r.cc ? r.cc.val : 0)}</td>
          <td class="num" style="text-align:right">${fmtMoney(r.sc ? r.sc.val : 0)}</td>
          <td style="text-align:right"><span class="pill ${resultClass(propia)}">${resultLabel(propia)}</span></td>
          <td class="num" style="text-align:right;color:var(--text-faint);">${fmtMoney(resultado)}</td>
        `;
        tr.addEventListener('click', () => openView(r.id));
        tbody.appendChild(tr);
      }
    }

    $('prevMonthBtn').addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1);
      render();
    });
    $('nextMonthBtn').addEventListener('click', () => {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1);
      render();
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
      const base = activeRegistros().filter(r => String(r.fecha||'').slice(0,7) === key);
      const total = base.length;
      const sumPropia = base.reduce((s,r) => s + deltaOf(r), 0);
      const sobras = base.filter(r => deltaOf(r) > EPS).length;
      const faltas = base.filter(r => deltaOf(r) < -EPS).length;
      const cuadran = total - sobras - faltas;

      $('statsTotales').innerHTML = `
        <div class="stat"><div class="n">${total}</div><div class="l">Total arqueos</div></div>
        <div class="stat"><div class="n ${sumPropia>EPS?'pos':sumPropia<-EPS?'neg':''}">${fmtMoney(sumPropia)}</div><div class="l">Variación del mes</div></div>
        <div class="stat"><div class="n">${cuadran}</div><div class="l">Bien</div></div>
        <div class="stat"><div class="n">${sobras}</div><div class="l">Sobrantes</div></div>
        <div class="stat"><div class="n">${faltas}</div><div class="l">Faltantes</div></div>
      `;

      const porEmpleado = {};
      base.forEach(r => {
        const propia = deltaOf(r);
        (r.empleados && r.empleados.length ? r.empleados : ['— Sin empleado —']).forEach(nombre => {
          if(!porEmpleado[nombre]) porEmpleado[nombre] = { total: 0, sobras: 0, faltas: 0 };
          porEmpleado[nombre].total++;
          if(propia > EPS) porEmpleado[nombre].sobras++;
          else if(propia < -EPS) porEmpleado[nombre].faltas++;
        });
      });
      const filas = Object.entries(porEmpleado).sort((a,b) => b[1].total - a[1].total);

      $('statsEmpleadoBody').innerHTML = filas.length ? `
        <table>
          <thead><tr><th>Empleado</th><th>Arqueos</th><th>Con sobra propia</th><th>Con falta propia</th></tr></thead>
          <tbody>
            ${filas.map(([nombre, d]) => `
              <tr>
                <td>${escapeHtml(nombre)}</td>
                <td>${d.total}</td>
                <td>${d.sobras}</td>
                <td>${d.faltas}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `<div class="empty" style="padding:24px;">Sin arqueos cargados este mes</div>`;
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
    function vField(label, value, mono){
      const v = (value === undefined || value === null) ? '' : String(value);
      const empty = !v;
      const display = empty ? '—' : escapeHtml(v);
      return `<div class="vfield">
        <div class="vlabel">${label}</div>
        <div class="vrow">
          <div class="vvalue ${mono?'mono':''} ${empty?'empty':''}">${display}</div>
          <button type="button" class="copy-btn${empty?' is-empty':''}" data-value="${empty?'':escapeAttr(v)}" title="Copiar">⧉</button>
        </div>
      </div>`;
    }

    function buildViewHtml(r){
      const resultado = r.resultado || 0;
      const propia = deltaOf(r);
      return `
        <div class="section-title">Datos del arqueo</div>
        <div class="vgrid">
          ${vField('Fecha y hora', fmtFechaHora(r.fecha))}
          ${vField('Empleados', (r.empleados||[]).join(', '))}
        </div>
        <div class="section-title">Valores</div>
        <div class="vgrid">
          ${vField('Caja fuerte (CF)', r.cf ? r.cf.expr : '0', true)}
          ${vField('Conteo de caja (CC)', r.cc ? r.cc.expr : '0', true)}
          ${vField('Saldo sistema (SC)', r.sc ? r.sc.expr : '0', true)}
        </div>
        <div class="section-title">Resultado</div>
        <div class="vgrid">
          ${vField('Diferencia de este arqueo', resultLabel(propia), true)}
          ${vField('Acumulado (arrastrado)', resultLabel(resultado), true)}
        </div>
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
      const r = registros.find(x => x.id === id);
      if(!r) return;
      $('modalTitle').textContent = 'Detalle de arqueo';
      $('viewBody').innerHTML = buildViewHtml(r);
      $('viewBody').style.display = 'block';
      $('form').style.display = 'none';
      $('viewFooter').style.display = 'flex';
      $('editFooter').style.display = 'none';
      attachCopyHandlers();
      overlay.classList.add('open');
    }

    function renderEmpleadosChecks(selected){
      const sel = new Set(selected || []);
      const known = empleados.map(e => e.nombre);
      const unlisted = [...sel].filter(n => !known.includes(n));
      const items = [
        ...empleados.map(e => ({ nombre: e.nombre, unlisted: false })),
        ...unlisted.map(n => ({ nombre: n, unlisted: true }))
      ];
      $('f_empleados').innerHTML = items.length ? items.map(it => `
        <label class="emp-check${it.unlisted?' unlisted':''}">
          <input type="checkbox" value="${escapeAttr(it.nombre)}" ${sel.has(it.nombre)?'checked':''}>
          <span>${escapeHtml(it.nombre)}${it.unlisted?' (no listado)':''}</span>
        </label>
      `).join('') : `<div class="cfg-empty">Cargá empleados en Configuración primero.</div>`;
    }

    function switchToEdit(){
      const r = registros.find(x => x.id === editingId);
      if(!r) return;
      clearForm();
      fillForm(r);
      lastAutoCf = null;
      updateCfHint(findPriorRegistro(r.fecha, r.id));
      $('modalTitle').textContent = 'Editar arqueo';
      $('viewBody').style.display = 'none';
      $('form').style.display = 'block';
      $('viewFooter').style.display = 'none';
      $('editFooter').style.display = 'flex';
      $('metaNote').textContent = '';
    }

    function openNew(){
      editingId = null;
      clearForm();
      const prior = findPriorRegistro(inputToIso($('f_fecha').value), null);
      $('f_cf').value = prior && prior.cf ? prior.cf.expr : '0';
      lastAutoCf = $('f_cf').value;
      updateResultPreview();
      updateCfHint(prior);
      $('modalTitle').textContent = 'Nuevo arqueo';
      $('viewBody').style.display = 'none';
      $('form').style.display = 'block';
      $('viewFooter').style.display = 'none';
      $('editFooter').style.display = 'flex';
      $('metaNote').textContent = '';
      overlay.classList.add('open');
    }

    $('f_fecha').addEventListener('change', () => {
      if(editingId) return;
      const prior = findPriorRegistro(inputToIso($('f_fecha').value), null);
      updateCfHint(prior);
      if($('f_cf').value === lastAutoCf){
        $('f_cf').value = prior && prior.cf ? prior.cf.expr : '0';
        lastAutoCf = $('f_cf').value;
        updateResultPreview();
      }
    });

    function closeModal(){
      overlay.classList.remove('open');
      editingId = null;
    }

    // ---------- Formulario ----------
    function clearForm(){
      $('f_fecha').value = nowLocalInput();
      $('f_cf').value = '0';
      $('f_cc').value = '';
      $('f_sc').value = '';
      renderEmpleadosChecks([]);
      updateResultPreview();
      root.querySelectorAll('.err').forEach(e => e.textContent = '');
      root.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    }

    function fillForm(r){
      $('f_fecha').value = isoToLocalInput(r.fecha) || nowLocalInput();
      $('f_cf').value = r.cf ? r.cf.expr : '0';
      $('f_cc').value = r.cc ? r.cc.expr : '';
      $('f_sc').value = r.sc ? r.sc.expr : '';
      renderEmpleadosChecks(r.empleados || []);
      updateResultPreview();
    }

    function readEmpleadosChecked(){
      return [...$('f_empleados').querySelectorAll('input[type=checkbox]:checked')].map(cb => cb.value);
    }

    function updateResultPreview(){
      const cf = toField($('f_cf').value);
      const cc = toField($('f_cc').value);
      const sc = toField($('f_sc').value);
      const resultado = cf.val + cc.val - sc.val;
      const prior = findPriorRegistro(inputToIso($('f_fecha').value), editingId);
      const propia = resultado - (prior ? (prior.resultado||0) : 0);
      const el = $('f_resultado');
      el.textContent = resultLabel(propia);
      el.className = 'val ' + (propia>EPS?'pos':propia<-EPS?'neg':'zero');
      $('f_acumulado').textContent = resultLabel(resultado);
    }
    ['f_cf','f_cc','f_sc'].forEach(id => $(id).addEventListener('input', updateResultPreview));

    function validate(){
      let ok = true;
      const fecha = $('f_fecha').value;
      const errFecha = $('err_fecha');
      if(!fecha){ errFecha.textContent = 'Requerida'; $('f_fecha').classList.add('invalid'); ok = false; }
      else { errFecha.textContent = ''; $('f_fecha').classList.remove('invalid'); }

      const emp = readEmpleadosChecked();
      const errEmp = $('err_empleados');
      if(!emp.length){ errEmp.textContent = 'Seleccioná al menos un empleado'; ok = false; }
      else { errEmp.textContent = ''; }
      return ok;
    }

    async function saveForm(){
      if(!validate()) return;
      const fecha = inputToIso($('f_fecha').value);
      const empleadosSel = readEmpleadosChecked();
      const payload = { fecha, empleados: empleadosSel, cf: $('f_cf').value, cc: $('f_cc').value, sc: $('f_sc').value };
      if(editingId){
        await api(`/api/arqueo/registros/${editingId}`, { method:'PUT', body: payload });
      } else {
        await api('/api/arqueo/registros', { method:'POST', body: payload });
      }
      await loadData();
      closeModal();
    }

    async function deleteEntry(){
      if(!editingId) return;
      if(!confirm('¿Eliminar este arqueo? Se va a quitar de la lista pero se conserva en la base.')) return;
      await api(`/api/arqueo/registros/${editingId}`, { method:'DELETE' });
      await loadData();
      closeModal();
    }

    $('newBtn').addEventListener('click', openNew);
    $('closeBtn').addEventListener('click', closeModal);
    $('viewCloseBtn').addEventListener('click', closeModal);
    $('viewEditBtn').addEventListener('click', switchToEdit);
    $('viewDeleteBtn').addEventListener('click', deleteEntry);
    $('cancelBtn').addEventListener('click', closeModal);
    $('saveBtn').addEventListener('click', saveForm);
    overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });

    escHandler = (e) => {
      if(e.key !== 'Escape') return;
      if(overlay.classList.contains('open')) closeModal();
      else if(statsOverlay.classList.contains('open')) closeStats();
    };
    document.addEventListener('keydown', escHandler);

    $('search').addEventListener('input', render);
    $('filterEmpleado').addEventListener('change', render);

    loadData();
  }

  function unmount(){
    if(escHandler){ document.removeEventListener('keydown', escHandler); escHandler = null; }
  }

  return { mount, unmount };
})();
