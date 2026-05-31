document.addEventListener('DOMContentLoaded', async () => {
  const tabsWrap = document.querySelector('.menu-tabs');
  const grid = document.querySelector('.menu-grid');

  if (!grid || !tabsWrap) {
    return;
  }

  let menuItems = [];

  function normalizeImagePath(path) {
    if (!path) return '../Images/food/main%20cross/pexels-campbell-downie-3549547-5317239.jpg';
    if (path.startsWith('http') || path.startsWith('..')) return path;
    return `../${path.replace(/^\/+/, '')}`;
  }

  function formatPrice(value) {
    const num = parseFloat(value);
    return Number.isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  }

  function buildTabs(categories) {
    tabsWrap.innerHTML = '';
    const allBtn = document.createElement('button');
    allBtn.className = 'menu-tab active';
    allBtn.type = 'button';
    allBtn.dataset.category = 'All';
    allBtn.textContent = 'All';
    tabsWrap.appendChild(allBtn);

    categories.forEach(category => {
      const btn = document.createElement('button');
      btn.className = 'menu-tab';
      btn.type = 'button';
      btn.dataset.category = category;
      btn.textContent = category;
      tabsWrap.appendChild(btn);
    });
  }

  function renderCategory(category) {
    const items = category === 'All'
      ? menuItems
      : menuItems.filter(item => String(item.category || '').toLowerCase() === category.toLowerCase());

    if (!items.length) {
      grid.innerHTML = '<div class="menu-info-card"><p>No menu items available.</p></div>';
      return;
    }

    const html = items.map((item, index) => {
      const isPriority = index === 0;
      const loading = isPriority ? 'eager' : 'lazy';
      const fetchPriority = isPriority ? 'high' : 'auto';
      const price = formatPrice(item.price);
      const imageSrc = normalizeImagePath(item.image_path);
      const orderUrl = `order.html?recipe_id=${encodeURIComponent(item.id)}&item=${encodeURIComponent(item.name)}&price=${encodeURIComponent(String(item.price))}`;
      return `
        <div class="menu-image-card">
          <img src="${imageSrc}" alt="${item.name}" loading="${loading}" decoding="async" fetchpriority="${fetchPriority}">
        </div>
        <div class="menu-info-card">
          <div class="menu-item-top">
            <h3>${String(item.name).replace(' ', '<br>')}</h3>
            <span>${price}</span>
          </div>
          <p>${item.description || ''}</p>
          <a href="${orderUrl}" class="menu-order-btn">Order now</a>
        </div>
      `;
    }).join('');

    grid.innerHTML = html;
  }

  function setActiveTab(tab) {
    const tabs = Array.from(tabsWrap.querySelectorAll('.menu-tab'));
    tabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    const category = tab.getAttribute('data-category') || 'All';
    renderCategory(category);
  }

  try {
    const res = await fetch('../api/get_menu.php');
    if (!res.ok) throw new Error('Failed to load menu');
    menuItems = await res.json();
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div class="menu-info-card"><p>Could not load menu items.</p></div>';
    return;
  }

  const categories = Array.from(
    new Set(menuItems.map(item => (item.category || 'Uncategorized').trim()).filter(Boolean))
  );

  buildTabs(categories);

  tabsWrap.addEventListener('click', (event) => {
    const tab = event.target.closest('.menu-tab');
    if (tab) setActiveTab(tab);
  });

  tabsWrap.addEventListener('keydown', (event) => {
    const tab = event.target.closest('.menu-tab');
    if (!tab) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(tab);
    }
  });

  const defaultTab = tabsWrap.querySelector('.menu-tab.active') || tabsWrap.querySelector('.menu-tab');
  if (defaultTab) {
    setActiveTab(defaultTab);
  }
});
