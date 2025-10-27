// Base API root for admin operations
const API_URL = 'https://projekt-dt207g-backend-maok1900.onrender.com/api';

// Cache DOM elements used by the admin UI
const els = {
  loginForm: document.getElementById('login-form'),
  logoutBtn: document.getElementById('logout-btn'),
  createForm: document.getElementById('create-form'),
  crud: document.getElementById('crud'),
  listCard: document.getElementById('list-card'),
  list: document.getElementById('admin-list'),
  status: document.getElementById('auth-status')
};

// Session-based token storage for authenticated requests
const tokenStore = {
  get: () => sessionStorage.getItem('token'),
  set: t => sessionStorage.setItem('token', t),
  clear: () => sessionStorage.removeItem('token')
};

// Update the small auth status indicator
function setStatus(txt){ els.status.textContent = txt; }

// Show/hide admin-only UI depending on auth state
function toggleAuthUI() {
  const has = !!tokenStore.get();
  els.crud.style.display = has ? 'block' : 'none';
  els.listCard.style.display = has ? 'block' : 'none';
  setStatus(has ? 'Inloggad.' : 'Inte inloggad.');
}

// Minimal HTTP helper that supports JSON and FormData with optional auth
async function http(path, { method='GET', data, auth=false, formData=false } = {}) {
  const headers = {};
  if (!formData) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = tokenStore.get();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: data ? (formData ? data : JSON.stringify(data)) : undefined
  });

  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const err = new Error((body && (body.message || body.error)) || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Clear field-specific and form-level errors in a form
function clearErrors(form) {
  form.querySelectorAll('.error').forEach(el => el.textContent = '');
  const fe = form.querySelector('[data-form-error]');
  if (fe) fe.textContent = '';
}

// Render validation errors into matching placeholders in a form
function renderErrors(form, payload) {
  if (payload && payload.errors && typeof payload.errors === 'object') {
    Object.entries(payload.errors).forEach(([field, msg]) => {
      const el = form.querySelector(`[data-error-for="${field}"]`);
      if (el) el.textContent = String(msg);
    });
  }
  const fe = form.querySelector('[data-form-error]');
  if (fe && payload && (payload.message || payload.error)) {
    fe.textContent = payload.message || payload.error;
  }
}

// Re-fetch and render the admin list of menu items
async function refresh() {
  try {
    const items = await http('/menu', { auth: true });
    els.list.innerHTML =
      (items || []).map(i => {
        const price = Number.isFinite(Number(i.price)) ? Number(i.price) : i.price;
        return `
        <li data-id="${i._id}">
          <b>${escapeHtml(i.title)}</b> — ${price} kr
          ${i.imageUrl ? `
            <div class="thumb-line">
              <img class="thumb" src="http://127.0.0.1:3000${i.imageUrl}" alt="${escapeHtml(i.imageAlt || i.title || '')}">
            </div>` : ''
          }
          <span class="right">
            <button data-act="edit">Ändra pris</button>
            <button data-act="image">Byt bild</button>
            <button data-act="delete">Ta bort</button>
          </span>
        </li>`;
      }).join('') || '<li>Inga artiklar ännu.</li>';
  } catch (e) {
    els.list.innerHTML = `<li>Kunde inte hämta listan.</li>`;
    console.error(e);
  }
}

// Escape helper to prevent HTML injection in text nodes/attributes
function escapeHtml(s=''){
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}

// Handle login submission and persist token on success
els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(els.loginForm);
  const body = {
    username: els.loginForm.username.value.trim(),
    password: els.loginForm.password.value
  };
  try {
    const res = await http('/login', { method: 'POST', data: body });
    tokenStore.set(res.token);
    els.loginForm.reset();
    toggleAuthUI();
    await refresh();
  } catch (err) {
    renderErrors(els.loginForm, err.body || { message: err.message });
  }
});

// Handle logout by clearing token and collapsing admin UI
els.logoutBtn.addEventListener('click', () => {
  tokenStore.clear();
  toggleAuthUI();
});

// Create a new menu item using multipart FormData (with optional image)
els.createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors(els.createForm);

  const fd = new FormData(els.createForm);
  const price = fd.get('price');
  if (price !== null && price !== '') fd.set('price', String(Number(price)));

  try {
    await http('/menu', { method: 'POST', data: fd, auth: true, formData: true });
    els.createForm.reset();
    await refresh();
  } catch (err) {
    renderErrors(els.createForm, err.body || { message: err.message });
  }
});

// Delegate list actions: edit price, change image, and delete
document.getElementById('admin-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button'); if (!btn) return;
  const li = btn.closest('li'); const id = li?.dataset.id; if (!id) return;

  // Delete an item after confirmation
  if (btn.dataset.act === 'delete') {
    if (!confirm('Ta bort artikeln?')) return;
    try {
      await http(`/menu/${id}`, { method: 'DELETE', auth: true });
      await refresh();
    } catch (err) {
      alert((err.body && err.body.message) || 'Kunde inte ta bort');
    }
    return;
  }

  // Edit the price with a numeric prompt
  if (btn.dataset.act === 'edit') {
    const newPrice = Number(prompt('Nytt pris (kr):'));
    if (!Number.isFinite(newPrice)) return;
    try {
      await http(`/menu/${id}`, { method: 'PUT', data: { price: newPrice }, auth: true });
      await refresh();
    } catch (err) {
      alert((err.body && err.body.message) || 'Kunde inte uppdatera');
    }
    return;
  }

  // Replace the item's image using a file picker
  if (btn.dataset.act === 'image') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const alt = prompt('Alt-text för bilden:', '');
      const fd = new FormData();
      fd.append('image', file);
      if (alt) fd.append('imageAlt', alt);
      try {
        await http(`/menu/${id}`, { method: 'PUT', data: fd, auth: true, formData: true });
        await refresh();
      } catch (err) {
        alert((err.body && err.body.message) || 'Kunde inte uppdatera bild');
      }
    };
    input.click();
    return;
  }
});

// Initialize UI state and pre-load list when already authenticated
toggleAuthUI();
if (tokenStore.get()) refresh();
