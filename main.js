  
// REST endpoint that returns the menu array
const API_URL = 'http://127.0.0.1:3000/api/menu';

// Base URL where static uploads are served (server exposes app.use('/uploads', ...))
const ASSETS_URL = 'http://127.0.0.1:3000';

// Wait until the DOM is ready, then load the menu
document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('menu-list');
  if (!listEl) {
    console.error('No element with id="menu-list" found on this page.');
    return;
  }
  loadMenu(listEl);
});

// a function to safely escape text for HTML injection
function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Returns one <li> row for a menu item
function itemRow(item) {
  const title = escapeHtml(item.title || '');
  const desc = escapeHtml(item.description || '');
  const price = Number.isFinite(Number(item.price)) ? `${Number(item.price)} kr` : '';
  const imgHtml = item.imageUrl
    ? `<img class="menu-img" src="${ASSETS_URL}${item.imageUrl}" alt="${escapeHtml(item.imageAlt || item.title || '')}">`
    : '';

  return `
    <li class="menu-item">
      ${imgHtml}
      <div class="meta">
        <div class="item">
          <div class="name">${title}</div>
          <div class="menu-line"><div class="line"></div></div>
          <div class="price">${price}</div>
        </div>
        ${desc ? `<div class="description">${desc}</div>` : ''}
      </div>
    </li>
  `;
}

// Fetches the menu from the API and renders it
async function loadMenu(listEl) {
  console.log('[menu] fetching…');
  try {
    const res = await fetch(API_URL);
    console.log('[menu] HTTP status:', res.status);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const items = await res.json();
    console.log('[menu] items:', items);

    listEl.innerHTML =
      Array.isArray(items) && items.length
        ? items.map(itemRow).join('')
        : '<li><div class="description">Inget i menyn än.</div></li>';

    // Clear any previous error message
    const errEl = document.getElementById('menu-error');
    if (errEl) errEl.textContent = '';
  } catch (err) {
    console.error('[menu] fetch error:', err);
    listEl.innerHTML =
      '<li><div class="description">Fel vid hämtning av menyn.</div></li>';
    const errEl = document.getElementById('menu-error');
    if (errEl) errEl.textContent = 'Fel vid hämtning av menyn';
  }
}
