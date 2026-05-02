/* ═══════════════════════════════════════════════════════════════════════════
   reservar.js — Formulario de reserva progresivo con campos-dropdown
   Flujo: Servicios → Fecha/Hora → Datos → Pago → Confirmación
   Cada campo despliega un panel de opciones al hacer click.
   Las secciones siguientes se revelan automáticamente al completar la anterior.
═══════════════════════════════════════════════════════════════════════════ */

const API = window.API_BASE_URL || '/api';

const HAIR_IMGS = {
  'corto':                 '../5.estetica/ICONOS%20PELO/PELO01.png',
  'melena':                '../5.estetica/ICONOS%20PELO/PELO02.png',
  'largo':                 '../5.estetica/ICONOS%20PELO/PELO03.png',
  'extra largo':           '../5.estetica/ICONOS%20PELO/PELO04.png',
  'extra largo abundante': '../5.estetica/ICONOS%20PELO/PELO05.png'
};

/* ── Estado global ─────────────────────────────────────────────────────────── */
const state = {
  servicios:       [],
  cart:            [],   // [{rowIdx, service_id, service_variant_id, nombre, precio, duracion, categoria}]
  fecha:           null,
  hora:            null,
  nombre:          '',
  apellido:        '',
  telefono:        '',
  email:           '',
  metodoPago:      null,
  upsellProducto:  null,
  upsellAgregado:  false,
  calYear:         new Date().getFullYear(),
  calMonth:        new Date().getMonth(),
  rowCount:        0
};

/* ── rows[idx] = {cat, service, variant} — estado de cada fila de selección ── */
const rows = {};

/* ════════════════════════════════════════════════════════════════════════════
   INICIALIZACIÓN
════════════════════════════════════════════════════════════════════════════ */

(async function init() {
  await cargarServicios();
  addServiceRow();
})();

async function cargarServicios() {
  try {
    const res = await fetch(`${API}/citas/publico/servicios`);
    if (!res.ok) throw new Error();
    state.servicios = await res.json();
  } catch {
    document.getElementById('kp-rows-container').innerHTML =
      '<p class="kp-msg kp-msg--error">No se pudieron cargar los servicios. Recargá la página.</p>';
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   FILAS DE SELECCIÓN DE SERVICIO
════════════════════════════════════════════════════════════════════════════ */

function addServiceRow() {
  const idx = state.rowCount++;
  rows[idx]  = { cat: null, service: null, variant: null };

  const categorias = [...new Set(
    state.servicios.map(s => s.categoria || 'General')
  )].sort();

  const row = document.createElement('div');
  row.className = 'kp-service-row';
  row.id        = `row-${idx}`;

  row.innerHTML = `
    <!-- Campo Categoría -->
    <div class="kp-field" id="field-cat-${idx}">
      <div class="kp-field__trigger" onclick="togglePanel('panel-cat-${idx}')">
        <span class="kp-field__label">CATEGORÍA</span>
        <span class="kp-field__val" id="val-cat-${idx}">Seleccioná una categoría</span>
        <svg class="kp-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="kp-field__panel" id="panel-cat-${idx}">
        ${categorias.map(cat => `
          <button class="kp-option" onclick="selectCategoria(${idx},'${cat.replace(/'/g,"\\'")}')">
            ${cat}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Campo Servicio (oculto hasta elegir categoría) -->
    <div class="kp-field kp-field--hidden" id="field-svc-${idx}">
      <div class="kp-field__trigger" onclick="togglePanel('panel-svc-${idx}')">
        <span class="kp-field__label">SERVICIO</span>
        <span class="kp-field__val" id="val-svc-${idx}">Seleccioná un servicio</span>
        <svg class="kp-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="kp-field__panel" id="panel-svc-${idx}"></div>
    </div>

    <!-- Campo Variante/Largo (oculto hasta elegir servicio con variantes) -->
    <div class="kp-field kp-field--hidden" id="field-var-${idx}">
      <div class="kp-field__trigger" onclick="togglePanel('panel-var-${idx}')">
        <span class="kp-field__label">LARGO</span>
        <span class="kp-field__val" id="val-var-${idx}">Seleccioná el largo</span>
        <svg class="kp-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="kp-field__panel" id="panel-var-${idx}"></div>
    </div>
  `;

  document.getElementById('kp-rows-container').appendChild(row);

  // Animar entrada
  requestAnimationFrame(() => row.classList.add('kp-service-row--in'));

  // Auto-abrir el campo de categoría
  setTimeout(() => togglePanel(`panel-cat-${idx}`), 120);
}

/* ════════════════════════════════════════════════════════════════════════════
   TOGGLES DE PANELES
════════════════════════════════════════════════════════════════════════════ */

function togglePanel(panelId) {
  const panel  = document.getElementById(panelId);
  if (!panel) return;

  const isOpen = panel.classList.contains('open');

  // Cerrar todos los paneles abiertos
  document.querySelectorAll('.kp-field__panel.open').forEach(p => {
    p.classList.remove('open');
    p.style.maxHeight = null;
  });
  document.querySelectorAll('.kp-field__trigger.open').forEach(t => t.classList.remove('open'));

  if (!isOpen) {
    panel.classList.add('open');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    const trigger = panel.previousElementSibling;
    if (trigger) trigger.classList.add('open');
  }
}

function updatePanelHeight(panelId) {
  const panel = document.getElementById(panelId);
  if (panel && panel.classList.contains('open')) {
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }
}

function closePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.classList.remove('open');
  panel.style.maxHeight = null;
  const trigger = panel.previousElementSibling;
  if (trigger) trigger.classList.remove('open');
}

/* ════════════════════════════════════════════════════════════════════════════
   SELECCIÓN: CATEGORÍA → SERVICIO → VARIANTE
════════════════════════════════════════════════════════════════════════════ */

function selectCategoria(idx, cat) {
  rows[idx].cat     = cat;
  rows[idx].service = null;
  rows[idx].variant = null;

  document.getElementById(`val-cat-${idx}`).textContent = cat;
  document.getElementById(`field-cat-${idx}`).classList.add('kp-field--done');
  closePanel(`panel-cat-${idx}`);

  // Filtrar y renderizar servicios de esta categoría
  const filtrados = state.servicios.filter(
    s => (s.categoria || 'General') === cat
  );

  const panel = document.getElementById(`panel-svc-${idx}`);
  panel.innerHTML = filtrados.map(s => {
    const dur = s.duracion ? ` · ${formatDuracion(s.duracion)}` : '';
    return `
      <button class="kp-option kp-option--svc" onclick="selectServicio(${idx}, ${s.id})">
        <span class="kp-option__name">${s.nombre}${dur}</span>
      </button>
    `;
  }).join('');

  // Mostrar y abrir campo de servicio
  document.getElementById(`field-svc-${idx}`).classList.remove('kp-field--hidden');
  setTimeout(() => togglePanel(`panel-svc-${idx}`), 120);
}

function selectServicio(idx, serviceId) {
  const svc = state.servicios.find(s => s.id === serviceId);
  if (!svc) return;

  rows[idx].service = svc;
  rows[idx].variant = null;

  document.getElementById(`val-svc-${idx}`).textContent = svc.nombre;
  document.getElementById(`field-svc-${idx}`).classList.add('kp-field--done');
  closePanel(`panel-svc-${idx}`);

  const hasVariants = svc.variantes?.length > 0;

  if (hasVariants) {
    // Rellenar panel de variantes con imágenes de largo
    const panel = document.getElementById(`panel-var-${idx}`);
    panel.innerHTML = `<div class="kp-variants-grid">
      ${svc.variantes.map(v => {
        const largoKey = (v.largo || 'melena').toLowerCase();
        const imgSrc   = HAIR_IMGS[largoKey] || HAIR_IMGS['melena'];
        const dur      = v.duracion_estimada ? formatDuracion(v.duracion_estimada) : '';
        return `
          <button class="kp-var-card" onclick="selectVariant(${idx}, ${v.id})">
            <img class="kp-var-card__img" src="${imgSrc}" alt="${v.nombre_variante}" />
            <span class="kp-var-card__name">${v.nombre_variante}</span>
            ${dur ? `<span class="kp-var-card__dur">${dur}</span>` : ''}
          </button>
        `;
      }).join('')}
    </div>`;

    document.getElementById(`field-var-${idx}`).classList.remove('kp-field--hidden');
    setTimeout(() => togglePanel(`panel-var-${idx}`), 120);
  } else {
    addToCart({
      rowIdx:             idx,
      service_id:         svc.id,
      service_variant_id: null,
      nombre:             svc.nombre,
      precio:             parseFloat(svc.precio),
      duracion:           svc.duracion,
      categoria:          svc.categoria
    });
  }
}

function selectVariant(idx, variantId) {
  const svc     = rows[idx].service;
  const variant = svc.variantes.find(v => v.id === variantId);
  if (!variant) return;

  rows[idx].variant = variant;

  document.getElementById(`val-var-${idx}`).textContent = variant.nombre_variante;
  document.getElementById(`field-var-${idx}`).classList.add('kp-field--done');
  closePanel(`panel-var-${idx}`);

  addToCart({
    rowIdx:             idx,
    service_id:         svc.id,
    service_variant_id: variant.id,
    nombre:             `${svc.nombre} — ${variant.nombre_variante}`,
    precio:             parseFloat(variant.precio),
    duracion:           variant.duracion_estimada || svc.duracion,
    categoria:          svc.categoria
  });
}

/* ════════════════════════════════════════════════════════════════════════════
   CARRITO
════════════════════════════════════════════════════════════════════════════ */

function addToCart(item) {
  // Reemplazar ítem existente de esta fila
  state.cart = state.cart.filter(i => i.rowIdx !== item.rowIdx);
  state.cart.push(item);
  renderCart();
  verificarSecFecha();
}

function removeFromCart(rowIdx) {
  state.cart = state.cart.filter(i => i.rowIdx !== rowIdx);

  const rowEl = document.getElementById(`row-${rowIdx}`);
  if (rowEl) {
    rowEl.style.opacity   = '0';
    rowEl.style.transform = 'translateX(-12px)';
    rowEl.style.transition = 'opacity 0.2s, transform 0.2s';
    setTimeout(() => rowEl.remove(), 220);
  }

  renderCart();
  verificarSecFecha();
}

function renderCart() {
  const cartEl = document.getElementById('kp-cart');
  const btnAdd = document.getElementById('btn-add-service');

  if (!state.cart.length) {
    cartEl.style.display = 'none';
    btnAdd.classList.add('hidden');
    return;
  }

  const total    = state.cart.reduce((s, i) => s + i.precio, 0);
  const durTotal = state.cart.reduce((s, i) => s + i.duracion, 0);
  const seña     = Math.round(total * 0.20);

  cartEl.style.display = 'block';
  cartEl.innerHTML = `
    <div class="kp-cart__header">
      <span class="kp-cart__title">TU SELECCIÓN</span>
      <span class="kp-cart__dur">${formatDuracion(durTotal)} en total</span>
    </div>
    ${state.cart.map(item => `
      <div class="kp-cart__item">
        <button class="kp-cart__remove" onclick="removeFromCart(${item.rowIdx})" aria-label="Quitar">✕</button>
        <span class="kp-cart__item-name">${item.nombre}</span>
        <span class="kp-cart__item-price">$${item.precio.toLocaleString('es-AR')}</span>
      </div>
    `).join('')}
    <div class="kp-cart__total">
      <span>Total</span>
      <span class="kp-cart__total-amt">$${total.toLocaleString('es-AR')}</span>
    </div>
    <div class="kp-cart__seña">
      Seña requerida: <strong>$${seña.toLocaleString('es-AR')}</strong>
      <span class="kp-seña-badge">20%</span>
    </div>
  `;

  btnAdd.classList.remove('hidden');
}

/* ════════════════════════════════════════════════════════════════════════════
   REVELACIÓN PROGRESIVA DE SECCIONES
════════════════════════════════════════════════════════════════════════════ */

function revelarSeccion(el, autoAction) {
  if (!el.classList.contains('kp-section--locked')) return;
  el.classList.remove('kp-section--locked');
  el.classList.add('kp-section--appeared');
  setTimeout(() => {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (autoAction) autoAction();
  }, 200);
}

function verificarSecFecha() {
  const sec = document.getElementById('sec-fecha');
  if (state.cart.length > 0) {
    revelarSeccion(sec, () => {
      renderCalendario();
      setTimeout(() => togglePanel('panel-fecha'), 350);
    });
  }
}

function verificarSecDatos() {
  const sec = document.getElementById('sec-datos');
  if (state.fecha && state.hora) {
    revelarSeccion(sec, () => {
      document.getElementById('inp-nombre')?.focus();
    });
  }
}

function verificarSecPago() {
  const nomOk   = state.nombre.trim().length >= 2;
  const apOk    = state.apellido.trim().length >= 2;
  const telOk   = state.telefono.replace(/\D/g, '').length >= 7;
  const emailOk = state.email === '' ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email);

  if (nomOk && apOk && telOk && emailOk) {
    const sec = document.getElementById('sec-pago');
    revelarSeccion(sec, () => {
      renderResumen();
      cargarUpsell();
    });
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   CALENDARIO
════════════════════════════════════════════════════════════════════════════ */

function renderCalendario() {
  const panel = document.getElementById('panel-fecha');
  const year  = state.calYear;
  const month = state.calMonth;

  const hoy     = new Date();
  hoy.setHours(0, 0, 0, 0);
  const mañana  = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);

  const primerDia = new Date(year, month, 1);
  const ultimoDia = new Date(year, month + 1, 0);
  const startDow  = primerDia.getDay(); // 0=Dom

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  let html = `
    <div class="kp-cal">
      <div class="kp-cal__nav">
        <button class="kp-cal__nav-btn" onclick="calPrev()">‹</button>
        <span class="kp-cal__mes">${meses[month]} ${year}</span>
        <button class="kp-cal__nav-btn" onclick="calNext()">›</button>
      </div>
      <div class="kp-cal__grid">
        <span class="kp-cal__dow">Do</span>
        <span class="kp-cal__dow">Lu</span>
        <span class="kp-cal__dow">Ma</span>
        <span class="kp-cal__dow">Mi</span>
        <span class="kp-cal__dow">Ju</span>
        <span class="kp-cal__dow">Vi</span>
        <span class="kp-cal__dow">Sá</span>
  `;

  for (let i = 0; i < startDow; i++) {
    html += '<span class="kp-cal__empty"></span>';
  }

  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const fecha    = new Date(year, month, d);
    const dateStr  = fecha.toISOString().split('T')[0];
    const esPasado = fecha < mañana;
    const esElegido = state.fecha === dateStr;

    if (esPasado) {
      html += `<span class="kp-cal__day kp-cal__day--past">${d}</span>`;
    } else {
      html += `<button class="kp-cal__day${esElegido ? ' kp-cal__day--selected' : ''}"
                       onclick="selectFecha('${dateStr}')">${d}</button>`;
    }
  }

  html += '</div></div>';
  panel.innerHTML = html;
}

function calPrev() {
  state.calMonth--;
  if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
  renderCalendario();
  updatePanelHeight('panel-fecha');
}

function calNext() {
  state.calMonth++;
  if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
  renderCalendario();
  updatePanelHeight('panel-fecha');
}

async function selectFecha(dateStr) {
  state.fecha = dateStr;
  state.hora  = null;

  const fecha    = new Date(dateStr + 'T12:00:00');
  const label    = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  document.getElementById('val-fecha').textContent = label;
  document.getElementById('field-fecha').classList.add('kp-field--done');

  // Re-renderizar para mostrar el día marcado
  renderCalendario();
  closePanel('panel-fecha');

  // Mostrar campo de hora y cargar slots
  await cargarSlots(dateStr);
}

/* ════════════════════════════════════════════════════════════════════════════
   SLOTS DE HORARIO
════════════════════════════════════════════════════════════════════════════ */

async function cargarSlots(fecha) {
  const durTotal  = state.cart.reduce((s, i) => s + i.duracion, 0);
  const horaField = document.getElementById('field-hora');
  const horaPanel = document.getElementById('panel-hora');

  // Resetear estado de hora
  state.hora = null;
  document.getElementById('val-hora').textContent = 'Seleccioná un horario';
  document.getElementById('field-hora').classList.remove('kp-field--done');

  horaPanel.innerHTML = '<p class="kp-msg">Cargando horarios...</p>';
  horaField.classList.remove('kp-field--hidden');
  setTimeout(() => togglePanel('panel-hora'), 120);

  try {
    const res  = await fetch(`${API}/citas/publico/disponibilidad?fecha=${fecha}&duracion_total=${durTotal}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (!data.disponibles?.length) {
      horaPanel.innerHTML = '<p class="kp-msg kp-msg--warn">No hay horarios disponibles para este día. Elegí otra fecha.</p>';
      updatePanelHeight('panel-hora');
      return;
    }

    horaPanel.innerHTML = `
      <div class="kp-slots">
        ${data.disponibles.map(slot => `
          <button class="kp-slot${state.hora === slot ? ' kp-slot--selected' : ''}"
                  onclick="selectHora('${slot}')">
            ${slot}
          </button>
        `).join('')}
      </div>
    `;
    updatePanelHeight('panel-hora');
  } catch {
    horaPanel.innerHTML = '<p class="kp-msg kp-msg--error">Error al cargar horarios. Intentá de nuevo.</p>';
    updatePanelHeight('panel-hora');
  }
}

function selectHora(hora) {
  state.hora = hora;
  document.getElementById('val-hora').textContent = hora + ' hs';
  document.getElementById('field-hora').classList.add('kp-field--done');
  closePanel('panel-hora');
  verificarSecDatos();
}

/* ════════════════════════════════════════════════════════════════════════════
   FORMULARIO DE DATOS — validación en tiempo real
════════════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const campos = [
    { id: 'inp-nombre',   key: 'nombre',   valid: v => v.trim().length >= 2 },
    { id: 'inp-apellido', key: 'apellido', valid: v => v.trim().length >= 2 },
    { id: 'inp-telefono', key: 'telefono', valid: v => v.replace(/\D/g,'').length >= 7 },
    { id: 'inp-email',    key: 'email',    valid: v => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) }
  ];

  campos.forEach(({ id, key, valid }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state[key] = el.value;
      const grupo = el.closest('.kp-input-group');
      if (el.value.length > 0) {
        grupo.classList.toggle('kp-input-group--ok',    valid(el.value));
        grupo.classList.toggle('kp-input-group--error', !valid(el.value));
      } else {
        grupo.classList.remove('kp-input-group--ok', 'kp-input-group--error');
      }
      verificarSecPago();
    });
  });
});

/* ════════════════════════════════════════════════════════════════════════════
   RESUMEN DEL PEDIDO
════════════════════════════════════════════════════════════════════════════ */

function renderResumen() {
  const total    = state.cart.reduce((s, i) => s + i.precio, 0);
  const durTotal = state.cart.reduce((s, i) => s + i.duracion, 0);
  const seña     = Math.round(total * 0.20);

  const fechaFmt = state.fecha
    ? new Date(state.fecha + 'T12:00:00').toLocaleDateString('es-AR',
        { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  document.getElementById('kp-resumen').innerHTML = `
    <div class="kp-resumen">
      <p class="kp-resumen__title">RESUMEN DE TU TURNO</p>
      ${state.cart.map(item => `
        <div class="kp-resumen__row">
          <span>${item.nombre}</span>
          <span>$${item.precio.toLocaleString('es-AR')}</span>
        </div>
      `).join('')}
      <div class="kp-resumen__row kp-resumen__row--meta">
        <span>Fecha</span>
        <span>${fechaFmt} a las ${state.hora} hs</span>
      </div>
      <div class="kp-resumen__row kp-resumen__row--meta">
        <span>Duración estimada</span>
        <span>${formatDuracion(durTotal)}</span>
      </div>
      <div class="kp-resumen__row kp-resumen__row--total">
        <span>Total</span>
        <span>$${total.toLocaleString('es-AR')}</span>
      </div>
      <div class="kp-resumen__seña">
        Seña requerida: <strong>$${seña.toLocaleString('es-AR')}</strong>
        <span class="kp-seña-badge">20% del total</span>
      </div>
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════════════════════
   ORDER BUMP (UPSELL)
════════════════════════════════════════════════════════════════════════════ */

async function cargarUpsell() {
  const categorias = [...new Set(state.cart.map(i => i.categoria))].join(',');
  try {
    const res      = await fetch(`${API}/citas/publico/productos-upsell?categorias=${encodeURIComponent(categorias)}`);
    if (!res.ok) throw new Error();
    const productos = await res.json();
    if (!productos.length) return;

    const prod         = productos[Math.floor(Math.random() * productos.length)];
    state.upsellProducto = prod;

    const upsellEl = document.getElementById('kp-upsell');
    upsellEl.style.display = 'block';
    upsellEl.innerHTML = `
      <div class="kp-upsell">
        <div class="kp-upsell__info">
          <p class="kp-upsell__eyebrow">¿LO SUMAMOS?</p>
          <p class="kp-upsell__name">${prod.nombre}</p>
          ${prod.descripcion ? `<p class="kp-upsell__desc">${prod.descripcion}</p>` : ''}
        </div>
        <div class="kp-upsell__side">
          <span class="kp-upsell__price">$${Number(prod.precio).toLocaleString('es-AR')}</span>
          <button class="kp-btn-upsell" onclick="agregarUpsell()">Agregar</button>
        </div>
      </div>
    `;
  } catch { /* silencioso */ }
}

function agregarUpsell() {
  state.upsellAgregado = true;
  const prod = state.upsellProducto;
  document.getElementById('kp-upsell').innerHTML = `
    <div class="kp-upsell kp-upsell--added">
      ✓ <strong>${prod.nombre}</strong> agregado — $${Number(prod.precio).toLocaleString('es-AR')}
    </div>
  `;
}

/* ════════════════════════════════════════════════════════════════════════════
   SELECCIÓN DE MÉTODO DE PAGO
════════════════════════════════════════════════════════════════════════════ */

function selectMetodoPago(metodo) {
  state.metodoPago = metodo;

  document.querySelectorAll('.kp-pago-opt').forEach(el => el.classList.remove('kp-pago-opt--selected'));
  document.querySelector(`.kp-pago-opt[data-metodo="${metodo}"]`).classList.add('kp-pago-opt--selected');

  const total = state.cart.reduce((s, i) => s + i.precio, 0);
  const seña  = Math.round(total * 0.20);
  const infoEl = document.getElementById('kp-pago-info');

  const msgs = {
    transferencia: `
      <div class="kp-pago-msg">
        <p>Recibís los datos bancarios por WhatsApp para transferir la seña.</p>
        <p class="kp-pago-msg__monto">Monto a transferir: <strong>$${seña.toLocaleString('es-AR')}</strong></p>
      </div>`,
    mercado_pago: `
      <div class="kp-pago-msg">
        <p>Próximamente disponible. Abonás la seña de <strong>$${seña.toLocaleString('es-AR')}</strong> con Mercado Pago.</p>
        <div class="kp-mp-placeholder">Integración en proceso — disponible pronto</div>
      </div>`,
    local: `
      <div class="kp-pago-msg">
        <p>Abonás el día del turno en el salón: efectivo, tarjeta o QR.</p>
        <p class="kp-descuento-inline">✦ 10% de descuento pagando en efectivo</p>
      </div>`
  };

  infoEl.innerHTML = msgs[metodo] || '';
  document.getElementById('btn-confirmar').disabled = false;
}

/* ════════════════════════════════════════════════════════════════════════════
   SUBMIT
════════════════════════════════════════════════════════════════════════════ */

async function submitReserva() {
  const btn = document.getElementById('btn-confirmar');
  btn.disabled    = true;
  btn.textContent = 'Reservando...';

  const body = {
    nombre:      state.nombre.trim(),
    apellido:    state.apellido.trim(),
    telefono:    state.telefono.trim(),
    email:       state.email.trim() || null,
    fecha_hora:  `${state.fecha}T${state.hora}:00`,
    metodo_pago: state.metodoPago,
    servicios:   state.cart.map(i => ({
      service_id:         i.service_id,
      service_variant_id: i.service_variant_id || null
    }))
  };

  try {
    const res  = await fetch(`${API}/citas/publico/reservar`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al reservar');

    mostrarConfirmacion(data.turno);
  } catch (err) {
    mostrarToast(err.message);
    btn.disabled    = false;
    btn.textContent = 'CONFIRMAR RESERVA';
  }
}

function mostrarConfirmacion(turno) {
  // Ocultar todas las secciones del formulario
  document.querySelectorAll('.kp-section:not(#sec-confirm)').forEach(s => {
    s.style.display = 'none';
  });

  const sec = document.getElementById('sec-confirm');
  sec.classList.remove('kp-section--locked');
  sec.classList.add('kp-section--appeared');
  sec.style.display = 'block';

  const fecha    = new Date(turno.fecha_hora);
  const fechaStr = fecha.toLocaleDateString('es-AR',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const horaStr  = fecha.toLocaleTimeString('es-AR',
    { hour: '2-digit', minute: '2-digit' });

  document.getElementById('kp-confirm-codigo').textContent = `Nº ${turno.id}`;
  document.getElementById('kp-confirm-body').innerHTML = `
    <div class="kp-confirm__row">
      <span class="kp-confirm__label">Servicios</span>
      <span class="kp-confirm__val">${turno.servicios.join(' + ')}</span>
    </div>
    <div class="kp-confirm__row">
      <span class="kp-confirm__label">Fecha</span>
      <span class="kp-confirm__val">${fechaStr}</span>
    </div>
    <div class="kp-confirm__row">
      <span class="kp-confirm__label">Hora</span>
      <span class="kp-confirm__val">${horaStr} hs</span>
    </div>
    <div class="kp-confirm__row">
      <span class="kp-confirm__label">Total</span>
      <span class="kp-confirm__val kp-confirm__val--price">$${Number(turno.total).toLocaleString('es-AR')}</span>
    </div>
    <div class="kp-confirm__row">
      <span class="kp-confirm__label">Seña</span>
      <span class="kp-confirm__val">$${Number(turno.seña).toLocaleString('es-AR')}</span>
    </div>
  `;

  sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ════════════════════════════════════════════════════════════════════════════
   UTILIDADES
════════════════════════════════════════════════════════════════════════════ */

function formatDuracion(min) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function mostrarToast(msg) {
  const prev = document.querySelector('.kp-toast');
  if (prev) prev.remove();
  const t = document.createElement('div');
  t.className   = 'kp-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}
