// API endpoint for public menu items
const API_URL = 'https://projekt-dt207g-backend-maok1900.onrender.com/api';

// Base URL for uploaded images served by the backend
const ASSETS_URL = 'http://127.0.0.1:3000';

// Initialize rendering when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const groupsEl = document.getElementById('menu-groups');
  if (!groupsEl) {
    console.error('Missing #menu-groups container.');
    return;
  }
  loadMenu(groupsEl);
});

// Escape potentially unsafe text for HTML rendering
function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Build a single <li> menu item
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

// Build a category section with heading and item list
function renderCategorySection(label, items) {
  const safeLabel = escapeHtml(label);
  const listHtml = items.map(itemRow).join('');
  return `
    <section class="menu-group" data-category="${safeLabel.toLowerCase()}">
      <h3 class="menu-group-title">${safeLabel}</h3>
      <ul class="menu-group-list">
        ${listHtml}
      </ul>
    </section>
  `;
}

// Fetch menu data, group by category, order groups, and render
async function loadMenu(containerEl) {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      containerEl.innerHTML = `
        <section class="menu-group">
          <ul class="menu-group-list">
            <li><div class="description">Inget i menyn än.</div></li>
          </ul>
        </section>`;
      return;
    }

    // Group items by category (case-insensitive), default to "Övrigt"
    const groupsMap = new Map();
    for (const it of items) {
      const label = (it.category || 'Övrigt').trim();
      const key = label.toLowerCase();
      if (!groupsMap.has(key)) groupsMap.set(key, { label, items: [] });
      groupsMap.get(key).items.push(it);
    }

    // Order preferred categories first, then alphabetical
    const preferredOrder = ['Mat', 'Dryck', 'Dessert'].map(s => s.toLowerCase());
    const groups = Array.from(groupsMap.values());
    const ordered = [
      ...groups
        .filter(g => preferredOrder.includes(g.label.toLowerCase()))
        .sort(
          (a, b) =>
            preferredOrder.indexOf(a.label.toLowerCase()) -
            preferredOrder.indexOf(b.label.toLowerCase())
        ),
      ...groups
        .filter(g => !preferredOrder.includes(g.label.toLowerCase()))
        .sort((a, b) => a.label.localeCompare(b.label, 'sv'))
    ];

    // Render all category sections
    containerEl.innerHTML = ordered.map(g => renderCategorySection(g.label, g.items)).join('');

    // Clear any existing error message
    const errEl = document.getElementById('menu-error');
    if (errEl) errEl.textContent = '';
  } catch (err) {
    console.error('Menu fetch failed:', err);
    containerEl.innerHTML = `
      <section class="menu-group">
        <ul class="menu-group-list">
          <li><div class="description">Fel vid hämtning av menyn.</div></li>
        </ul>
      </section>`;
    const errEl = document.getElementById('menu-error');
    if (errEl) errEl.textContent = 'Fel vid hämtning av menyn';
  }
}
