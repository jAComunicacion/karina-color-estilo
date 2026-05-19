requireAuth();

const user = getUser();
if (user) document.getElementById('nav-user').textContent = user.nombre || user.email;

let currentDate = new Date();
let citaIdEditing = null;
let estadoSeleccionado = null;
let citasDelDia = [];

const ESTADOS_LABEL = {
  reservado: 'Reservado',
  confirmado: 'Confirmado',
  completado: 'Completado',
  cancelado: 'Cancelado'
};

function moveDay(delta) {
  currentDate.setDate(currentDate.getDate() + delta);
  loadAgenda();
}

function goToday() {
  currentDate = new Date();
  loadAgenda();
}

function updateDateLabel() {
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const label = currentDate.toLocaleDateString('es-AR', opts);
  document.getElementById('date-label').textContent =
    label.charAt(0).toUpperCase() + label.slice(1);
}

async function loadAgenda() {
  updateDateLabel();
  const tbody = document.getElementById('agenda-tbody');
  tbody.innerHTML = `<tr><td colspan="6"><div class="kpa-empty"><p class="kpa-empty-text">Cargando...</p></div></td></tr>`;

  try {
    const fecha = toDateStr(currentDate);
    const data = await apiFetch(`/citas?fecha=${fecha}`);
    citasDelDia = Array.isArray(data) ? data : (data.citas || []);
    renderTabla(citasDelDia);
    renderStats(citasDelDia);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="kpa-empty">
      <div class="kpa-empty-icon">⚠️</div>
      <p class="kpa-empty-text">Error al cargar. ${err.message || ''}</p>
    </div></td></tr>`;
  }
}

function renderStats(citas) {
  document.getElementById('stat-total').textContent = citas.length;
  document.getElementById('stat-confirmados').textContent =
    citas.filter(c => c.estado === 'confirmado').length;
  document.getElementById('stat-pendientes').textContent =
    citas.filter(c => c.estado === 'pendiente').length;
}

function renderTabla(citas) {
  const tbody = document.getElementById('agenda-tbody');

  if (!citas.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="kpa-empty">
      <div class="kpa-empty-icon">📅</div>
      <p class="kpa-empty-text">No hay turnos para este día.</p>
    </div></td></tr>`;
    return;
  }

  const sorted = [...citas].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  tbody.innerHTML = sorted.map(c => {
    const cliente = c.client || c.cliente || {};
    const nombreCliente = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || '—';
    const tel = cliente.telefono || '';
    const items = c.items || [];
    const serviciosStr = items.length
      ? items.map(i => i.nombre_snapshot || i.nombre || '—').join('<br>')
      : (c.servicio?.nombre || '—');
    const duracion = getDuracion(c);
    const badgeClass = `kpa-badge--${c.estado || 'reservado'}`;
    const badgeLabel = ESTADOS_LABEL[c.estado] || c.estado || 'Reservado';
    const hora = c.fecha_hora
      ? new Date(c.fecha_hora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '—';

    return `<tr>
      <td class="kpa-table-hora">${hora}</td>
      <td class="kpa-table-cliente">
        <strong>${nombreCliente}</strong>
        ${tel ? `<span>${tel}</span>` : ''}
      </td>
      <td class="kpa-table-servicios">${serviciosStr}</td>
      <td class="kpa-table-duracion">${duracion ? duracion + ' min' : '—'}</td>
      <td><span class="kpa-badge ${badgeClass}">${badgeLabel}</span></td>
      <td>
        <div class="kpa-table-actions">
          <button class="kpa-btn-action" onclick="openModalEstado(${c.id})">Estado</button>
          ${tel ? `<a class="kpa-btn-action" href="https://wa.me/549${tel.replace(/\D/g,'')}" target="_blank" rel="noopener">WA</a>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openModalEstado(citaId) {
  citaIdEditing = citaId;
  const cita = citasDelDia.find(c => c.id === citaId);
  if (!cita) return;

  const cliente = cita.client || cita.cliente || {};
  const nombreCliente = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || '—';
  const hora = (cita.hora_inicio || '').slice(0, 5);
  const fecha = toFechaLegible(currentDate.toISOString().slice(0, 10));

  document.getElementById('modal-cita-info').innerHTML =
    `<strong>${nombreCliente}</strong> — ${fecha} a las ${hora}`;

  estadoSeleccionado = cita.estado || 'reservado';
  document.querySelectorAll('.kpa-estado-opt').forEach(el => {
    el.classList.toggle('kpa-estado-opt--selected', el.dataset.estado === estadoSeleccionado);
  });

  openModal('modal-estado');
}

function selectEstado(estado) {
  estadoSeleccionado = estado;
  document.querySelectorAll('.kpa-estado-opt').forEach(el => {
    el.classList.toggle('kpa-estado-opt--selected', el.dataset.estado === estado);
  });
}

async function guardarEstado() {
  if (!citaIdEditing || !estadoSeleccionado) return;
  const btn = document.getElementById('btn-guardar-estado');
  btn.disabled = true;
  btn.textContent = 'GUARDANDO...';

  try {
    await apiFetch(`/citas/${citaIdEditing}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: estadoSeleccionado })
    });
    closeModal('modal-estado');
    await loadAgenda();
  } catch (err) {
    alert('Error al guardar: ' + (err.message || 'Intentá de nuevo'));
  } finally {
    btn.disabled = false;
    btn.textContent = 'GUARDAR';
  }
}

document.getElementById('modal-estado').addEventListener('click', function(e) {
  if (e.target === this) closeModal('modal-estado');
});

document.getElementById('modal-nuevo-turno').addEventListener('click', function(e) {
  if (e.target === this) closeModal('modal-nuevo-turno');
});

document.getElementById('modal-nueva-clienta').addEventListener('click', function(e) {
  if (e.target === this) closeModal('modal-nueva-clienta');
});

loadAgenda();

// ─── Nuevo Turno ────────────────────────────────────────────

let clienteIdNuevoTurno = null;
let servicioIdNuevoTurno = null;

async function openModalNuevoTurno() {
  clienteIdNuevoTurno = null;
  servicioIdNuevoTurno = null;

  document.getElementById('nt-fecha').value = toDateStr(currentDate);
  document.getElementById('nt-hora').value = '';
  document.getElementById('nt-sena').value = '0';
  document.getElementById('nt-error').classList.add('hidden');

  document.getElementById('chips-clientas').innerHTML = '<span class="knt-loading">Cargando…</span>';
  document.getElementById('chips-servicios').innerHTML = '<span class="knt-loading">Cargando…</span>';
  document.getElementById('select-clienta').innerHTML = '<option value="">Seleccioná una clienta…</option>';
  document.getElementById('select-servicio').innerHTML = '<option value="">Seleccioná un servicio…</option>';

  openModal('modal-nuevo-turno');

  try {
    const [clientasData, serviciosData] = await Promise.all([
      apiFetch('/clientes'),
      apiFetch('/servicios')
    ]);
    const clientas = Array.isArray(clientasData) ? clientasData : (clientasData.clientes || []);
    const servicios = Array.isArray(serviciosData) ? serviciosData : (serviciosData.servicios || []);
    renderChipsClientas(clientas);
    renderChipsServicios(servicios);
  } catch (err) {
    document.getElementById('chips-clientas').innerHTML =
      `<span class="knt-loading" style="color:var(--kp-rojo)">Error al cargar</span>`;
    document.getElementById('chips-servicios').innerHTML =
      `<span class="knt-loading" style="color:var(--kp-rojo)">Error al cargar</span>`;
  }
}

function renderChipsClientas(clientas) {
  const wrap = document.getElementById('chips-clientas');
  const sel = document.getElementById('select-clienta');

  wrap.innerHTML = clientas.map(c => {
    const nombre = `${c.nombre || ''} ${c.apellido || ''}`.trim();
    return `<button class="knt-chip" data-id="${c.id}" onclick="selectClientaChip(${c.id}, this)">${nombre}</button>`;
  }).join('') +
    `<button class="knt-chip knt-chip--nueva" onclick="openModalNuevaClientaRapida()">+ Nueva clienta</button>`;

  sel.innerHTML = '<option value="">Seleccioná una clienta…</option>' +
    clientas.map(c => {
      const nombre = `${c.nombre || ''} ${c.apellido || ''}`.trim();
      return `<option value="${c.id}">${nombre}</option>`;
    }).join('') +
    '<option value="nueva">+ Nueva clienta…</option>';

  sel.onchange = function() {
    if (this.value === 'nueva') {
      clienteIdNuevoTurno = null;
      openModalNuevaClientaRapida();
      this.value = '';
    } else {
      clienteIdNuevoTurno = this.value ? parseInt(this.value) : null;
    }
  };
}

function renderChipsServicios(servicios) {
  const wrap = document.getElementById('chips-servicios');
  const sel = document.getElementById('select-servicio');

  wrap.innerHTML = servicios.map(s => {
    const nombre = s.nombre || s.name || '—';
    return `<button class="knt-chip" data-id="${s.id}" onclick="selectServicioChip(${s.id}, this)">${nombre}</button>`;
  }).join('');

  sel.innerHTML = '<option value="">Seleccioná un servicio…</option>' +
    servicios.map(s => {
      const nombre = s.nombre || s.name || '—';
      return `<option value="${s.id}">${nombre}</option>`;
    }).join('');

  sel.onchange = function() {
    servicioIdNuevoTurno = this.value ? parseInt(this.value) : null;
  };
}

function selectClientaChip(id, el) {
  clienteIdNuevoTurno = id;
  document.querySelectorAll('#chips-clientas .knt-chip').forEach(c => c.classList.remove('knt-chip--selected'));
  el.classList.add('knt-chip--selected');
}

function selectServicioChip(id, el) {
  servicioIdNuevoTurno = id;
  document.querySelectorAll('#chips-servicios .knt-chip').forEach(c => c.classList.remove('knt-chip--selected'));
  el.classList.add('knt-chip--selected');
}

async function crearTurno() {
  const errDiv = document.getElementById('nt-error');
  const btn = document.getElementById('btn-crear-turno');
  errDiv.classList.add('hidden');

  const fecha = document.getElementById('nt-fecha').value;
  const hora = document.getElementById('nt-hora').value;

  if (!fecha || !hora) {
    errDiv.textContent = 'Completá la fecha y hora del turno.';
    errDiv.classList.remove('hidden');
    return;
  }

  const clientaId = clienteIdNuevoTurno || (() => {
    const v = document.getElementById('select-clienta').value;
    return (v && v !== 'nueva') ? parseInt(v) : null;
  })();

  if (!clientaId) {
    errDiv.textContent = 'Seleccioná una clienta.';
    errDiv.classList.remove('hidden');
    return;
  }

  const servicioId = servicioIdNuevoTurno || (() => {
    const v = document.getElementById('select-servicio').value;
    return v ? parseInt(v) : null;
  })();

  if (!servicioId) {
    errDiv.textContent = 'Seleccioná un servicio.';
    errDiv.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'CREANDO...';

  try {
    const sena = parseFloat(document.getElementById('nt-sena').value) || 0;
    await apiFetch('/citas', {
      method: 'POST',
      body: JSON.stringify({
        cliente_id: clientaId,
        servicio_id: servicioId,
        fecha_hora: `${fecha}T${hora}:00`,
        estado: 'reservado',
        ...(sena > 0 && { sena })
      })
    });
    closeModal('modal-nuevo-turno');
    await loadAgenda();
  } catch (err) {
    errDiv.textContent = err.message || 'Error al crear el turno. Intentá de nuevo.';
    errDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'CREAR TURNO';
  }
}

// ─── Nueva clienta rápida (popup secundario) ────────────────

function openModalNuevaClientaRapida() {
  document.getElementById('nc-nombre').value = '';
  document.getElementById('nc-apellido').value = '';
  document.getElementById('nc-tel').value = '';
  document.getElementById('nc-email').value = '';
  document.getElementById('nc-error').classList.add('hidden');
  openModal('modal-nueva-clienta');
  setTimeout(() => document.getElementById('nc-nombre').focus(), 50);
}

async function guardarNuevaClientaRapida() {
  const errDiv = document.getElementById('nc-error');
  const btn = document.getElementById('btn-guardar-nc');
  errDiv.classList.add('hidden');

  const nombre = document.getElementById('nc-nombre').value.trim();
  const apellido = document.getElementById('nc-apellido').value.trim();
  const telefono = document.getElementById('nc-tel').value.trim();
  const email = document.getElementById('nc-email').value.trim();

  if (!nombre || !apellido || !telefono) {
    errDiv.textContent = 'Nombre, apellido y teléfono son obligatorios.';
    errDiv.classList.remove('hidden');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'GUARDANDO...';

  try {
    const nueva = await apiFetch('/clientes', {
      method: 'POST',
      body: JSON.stringify({ nombre, apellido, telefono, ...(email && { email }) })
    });

    const id = nueva.id || nueva.cliente?.id;
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    closeModal('modal-nueva-clienta');

    // Agrega el chip al modal de turno y lo selecciona
    const wrap = document.getElementById('chips-clientas');
    const chipNueva = wrap.querySelector('.knt-chip--nueva');
    const nuevoChip = document.createElement('button');
    nuevoChip.className = 'knt-chip knt-chip--selected';
    nuevoChip.dataset.id = id;
    nuevoChip.textContent = nombreCompleto;
    nuevoChip.onclick = function() { selectClientaChip(id, this); };
    wrap.insertBefore(nuevoChip, chipNueva);

    // También agrega al select mobile
    const sel = document.getElementById('select-clienta');
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = nombreCompleto;
    sel.insertBefore(opt, sel.querySelector('option[value="nueva"]'));
    sel.value = id;

    // Limpia selección previa y marca el nuevo
    document.querySelectorAll('#chips-clientas .knt-chip').forEach(c => {
      if (c !== nuevoChip) c.classList.remove('knt-chip--selected');
    });

    clienteIdNuevoTurno = id;

  } catch (err) {
    errDiv.textContent = err.message || 'Error al guardar. Intentá de nuevo.';
    errDiv.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'GUARDAR';
  }
}
