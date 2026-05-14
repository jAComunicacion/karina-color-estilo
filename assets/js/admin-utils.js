const API = window.API_BASE_URL || (window.location.origin + '/api');

function getToken() {
  return localStorage.getItem('kps_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('kps_user'));
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem('kps_token', token);
  localStorage.setItem('kps_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('kps_token');
  localStorage.removeItem('kps_user');
  window.location.href = 'admin.html';
}

function requireAuth() {
  if (!getToken()) window.location.href = 'admin.html';
}

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(opts.headers || {})
    }
  });
  if (res.status === 401) { logout(); return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toFechaLegible(str) {
  const [y, m, d] = str.split('-');
  const meses = ['enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
}

function getDuracion(cita) {
  if (cita.duracion_minutos) return cita.duracion_minutos;
  const items = cita.items || [];
  if (items.length) return items.reduce((s, i) => s + (i.duracion_minutos || 0), 0);
  return cita.servicio?.duracion_minutos || 0;
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
