document.addEventListener('DOMContentLoaded', () => {
  let tabs = Array.from(document.querySelectorAll('.menu-tab'));
  const tabsWrap = document.querySelector('.menu-tabs');
  const grid = document.querySelector('.menu-grid');

  if (!grid || tabs.length === 0) {
    return;
  }

  let apiMenuData = [];

  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const normalizeImagePath = (path) => {
    if (!path) return '../Images/menu/chefsign1.jpg';
    if (/^(https?:)?\/\//i.test(path) || path.startsWith('../')) return path;
    return `../${path.replace(/^\/+/, '').replace(/\\/g, '/')}`;
  };

  const splitTitle = (name = '') => {
    const words = String(name).trim().split(/\s+/);
    if (words.length < 3) return escapeHtml(name);
    const midpoint = Math.ceil(words.length / 2);
    return `${escapeHtml(words.slice(0, midpoint).join(' '))}<br>${escapeHtml(words.slice(midpoint).join(' '))}`;
  };

  const bindTabEvents = (tab) => {
    tab.addEventListener('click', () => setActiveTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActiveTab(tab);
      }
    });
  };

  const syncCategoryTabs = () => {
    if (!tabsWrap) return;

    const categories = [...new Set(apiMenuData
      .map(item => (item.category || 'Special').trim())
      .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const tabCategories = ['All', ...categories];
    tabsWrap.innerHTML = tabCategories.map((category, index) => `
      <button class="menu-tab${index === 0 ? ' active' : ''}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    `).join('');

    tabs = Array.from(tabsWrap.querySelectorAll('.menu-tab'));
    tabs.forEach(bindTabEvents);
  };

  const loadApiMenu = async () => {
    try {
      const res = await fetch('../api/get_menu.php');
      if (!res.ok) throw new Error('Failed to load menu');
      apiMenuData = await res.json();
      syncCategoryTabs();
      
      const defaultTab = document.querySelector('.menu-tab.active') || tabs[0];
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
      grid.innerHTML = '<p class="error-msg">Could not load menu. Please try again later.</p>';
    }
  };

  const renderCategory = (category) => {
    const selectedCategory = (category || 'All').toLowerCase();
    const items = selectedCategory === 'all'
      ? apiMenuData
      : apiMenuData.filter(item =>
        item.category && item.category.toLowerCase() === selectedCategory
      );

    if (items.length === 0) {
      grid.innerHTML = `<p class="no-items">No approved menu items available for ${escapeHtml(category)} yet.</p>`;
      return;
    }

    const html = items.map((item, index) => {
      const isPriority = index === 0;
      const loading = isPriority ? 'eager' : 'lazy';
      const fetchPriority = isPriority ? 'high' : 'auto';
      const imagePath = normalizeImagePath(item.image_path);
      const price = Number.parseFloat(item.price) || 0;
      const orderUrl = new URL('order.html', window.location.href);
      orderUrl.searchParams.set('item', item.name);
      orderUrl.searchParams.set('price', price.toFixed(2));
      if (item.id) orderUrl.searchParams.set('recipe_id', item.id);
      
      return `
        <div class="menu-image-card">
          <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(item.name)}" loading="${loading}" decoding="async" fetchpriority="${fetchPriority}">
        </div>
        <div class="menu-info-card">
          <div class="menu-item-top">
            <h3>${splitTitle(item.name)}</h3>
            <span>$${price.toFixed(2)}</span>
          </div>
          <p>${escapeHtml(item.description || 'Delicious freshly prepared dish.')}</p>
          <a href="${escapeHtml(orderUrl.pathname.split('/').pop() + orderUrl.search)}" class="menu-order-btn">Order now</a>
        </div>
      `;
    }).join('');

    grid.innerHTML = html;
  };

  const setActiveTab = (tab) => {
    tabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    const category = tab.getAttribute('data-category');
    renderCategory(category);
  };

  tabs.forEach(bindTabEvents);

  loadApiMenu();
});
