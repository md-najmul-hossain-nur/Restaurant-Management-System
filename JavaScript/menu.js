document.addEventListener('DOMContentLoaded', () => {
  const tabs = Array.from(document.querySelectorAll('.menu-tab'));
  const grid = document.querySelector('.menu-grid');

  if (!grid || tabs.length === 0) {
    return;
  }

  let apiMenuData = [];

  const loadApiMenu = async () => {
    try {
      const res = await fetch('../api/get_menu.php');
      apiMenuData = await res.json();
      
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
    // Filter API data by category
    const items = apiMenuData.filter(item => 
      item.category && item.category.toLowerCase() === category.toLowerCase()
    );

    if (items.length === 0) {
      grid.innerHTML = `<p class="no-items">No items available for ${category} yet.</p>`;
      return;
    }

    const html = items.map((item, index) => {
      const isPriority = index === 0;
      const loading = isPriority ? 'eager' : 'lazy';
      const fetchPriority = isPriority ? 'high' : 'auto';
      const imagePath = item.image_path ? `../${item.image_path}` : '../Images/food/placeholder.jpg';
      
      return `
        <div class="menu-image-card">
          <img src="${imagePath}" alt="${item.name}" loading="${loading}" decoding="async" fetchpriority="${fetchPriority}">
        </div>
        <div class="menu-info-card">
          <div class="menu-item-top">
            <h3>${item.name.replace(' ', '<br>')}</h3>
            <span>$${parseFloat(item.price).toFixed(2)}</span>
          </div>
          <p>${item.description || 'Delicious freshly prepared dish.'}</p>
          <a href="order.html?item=${encodeURIComponent(item.name)}&price=${encodeURIComponent(item.price)}" class="menu-order-btn">Order now</a>
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

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setActiveTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActiveTab(tab);
      }
    });
  });

  loadApiMenu();
});
