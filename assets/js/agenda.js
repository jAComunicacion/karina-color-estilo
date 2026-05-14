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

loadAgenda();
