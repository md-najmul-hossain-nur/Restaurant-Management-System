document.addEventListener('DOMContentLoaded', () => {
  const tabs = Array.from(document.querySelectorAll('.menu-tab'));
  const grid = document.querySelector('.menu-grid');

  if (!grid || tabs.length === 0) {
    return;
  }

  const menuData = {
    Breakfast: [
      {
        title: 'Classic Breakfast Plate',
        price: '$12',
        desc: 'Eggs, toast, sausage, seasonal greens',
        image: '../Images/food/main%20cross/pexels-valeriya-29380158.jpg'
      },
      {
        title: 'Golden Pancake Stack',
        price: '$10',
        desc: 'Honey butter, berries, maple syrup',
        image: '../Images/food/main%20cross/pexels-valeriya-7474366.jpg'
      },
      {
        title: 'Avocado Sunrise',
        price: '$11',
        desc: 'Sourdough, avocado, poached egg, herbs',
        image: '../Images/food/main%20cross/pexels-valeriya-7474370.jpg'
      },
      {
        title: 'Breakfast Bowl',
        price: '$13',
        desc: 'Quinoa, roasted veggies, feta, egg',
        image: '../Images/food/main%20cross/pexels-vince-17568011.jpg'
      }
    ],
    Lunch: [
      {
        title: 'Grilled Chicken Salad',
        price: '$14',
        desc: 'Citrus greens, cherry tomato, feta',
        image: '../Images/food/main%20cross/pexels-julia-chalova-10303257.jpg'
      },
      {
        title: 'Signature Burger',
        price: '$16',
        desc: 'Smoked cheese, caramelized onion, fries',
        image: '../Images/food/main%20cross/pexels-lucas-porras-1937324539-35723478.jpg'
      },
      {
        title: 'Spicy Beef Bowl',
        price: '$15',
        desc: 'Rice, grilled beef, roasted peppers',
        image: '../Images/food/main%20cross/pexels-mohamed9380-36682995.jpg'
      },
      {
        title: 'Creamy Pasta',
        price: '$13',
        desc: 'Mushroom sauce, parmesan, herbs',
        image: '../Images/food/main%20cross/pexels-mohamed9380-36691316.jpg'
      }
    ],
    Dinner: [
      {
        title: 'Herb Roasted Salmon',
        price: '$22',
        desc: 'Lemon butter, asparagus, potatoes',
        image: '../Images/food/main%20cross/pexels-campbell-downie-3549547-5317239.jpg'
      },
      {
        title: 'Steakhouse Special',
        price: '$28',
        desc: 'Prime steak, garlic mash, jus',
        image: '../Images/food/main%20cross/pexels-ionela-mat-268382825-19671341.jpg'
      },
      {
        title: 'Mediterranean Plate',
        price: '$20',
        desc: 'Grilled veggies, hummus, pita',
        image: '../Images/food/main%20cross/pexels-valeriya-9328495.jpg'
      },
      {
        title: 'Saffron Chicken',
        price: '$21',
        desc: 'Aromatic rice, yogurt sauce',
        image: '../Images/menu/saffronchicken.jpg'
      }
    ],
    Drinks: [
      {
        title: 'Citrus Cooler',
        price: '$6',
        desc: 'Orange, lime, mint, soda',
        image: '../Images/menu/cooler.jpg'
      },
      {
        title: 'Berry Sparkler',
        price: '$7',
        desc: 'Mixed berries, tonic, basil',
        image: '../Images/menu/berry.jpg'
      },
      {
        title: 'Cold Brew Latte',
        price: '$6',
        desc: 'Smooth espresso, oat milk, ice',
        image: '../Images/menu/coller.jpg'
      },
      {
        title: 'Tropical Fizz',
        price: '$7',
        desc: 'Pineapple, ginger, sparkling',
        image: '../Images/menu/tropicalfizz.jpg'
      }
    ],
    Desserts: [
      {
        title: 'Chocolate Lava Cake',
        price: '$9',
        desc: 'Warm cake, vanilla gelato',
        image: '../Images/menu/choclatelavacake.jpg'
      },
      {
        title: 'Classic Tiramisu',
        price: '$8',
        desc: 'Espresso, mascarpone, cocoa',
        image: '../Images/menu/classictiramisu.jpg'
      },
      {
        title: 'Berry Cheesecake',
        price: '$9',
        desc: 'Creamy filling, berry glaze',
        image: '../Images/menu/berrychessecake.jpg'
      },
      {
        title: 'Citrus Tart',
        price: '$8',
        desc: 'Lemon curd, almond crust',
        image: '../Images/menu/citrustart.jpg'
      }
    ],
    
    Special: [
      {
        title: 'Chef Signature Platter',
        price: '$24',
        desc: 'Seasonal grill, house sauce',
        image: '../Images/menu/chefsign1.jpg'
      },
      {
        title: 'Seafood Trio',
        price: '$26',
        desc: 'Prawn, salmon, calamari',
        image: '../Images/menu/Seafoodtrio.jpg'
      },
      {
        title: 'Garden Harvest',
        price: '$19',
        desc: 'Roasted veggies, herb drizzle',
        image: '../Images/menu/GardenHarvest.jpg'
      },
      {
        title: 'Slow Cooked Beef',
        price: '$25',
        desc: 'Braised beef, creamy mash',
        image: '../Images/menu/showcokkedbeef.jpg'
      }
    ]
  };

  const renderCategory = (category) => {
    const items = menuData[category] || [];
    const html = items.map((item, index) => {
      const isPriority = index === 0;
      const loading = isPriority ? 'eager' : 'lazy';
      const fetchPriority = isPriority ? 'high' : 'auto';
      return `
        <div class="menu-image-card">
          <img src="${item.image}" alt="${item.title}" loading="${loading}" decoding="async" fetchpriority="${fetchPriority}">
        </div>
        <div class="menu-info-card">
          <div class="menu-item-top">
            <h3>${item.title.replace(' ', '<br>')}</h3>
            <span>${item.price}</span>
          </div>
          <p>${item.desc}</p>
          <a href="order.html?item=${encodeURIComponent(item.title)}&price=${encodeURIComponent(item.price.replace('$', ''))}" class="menu-order-btn">Order now</a>
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

  const defaultTab = document.querySelector('.menu-tab.active') || tabs[0];
  if (defaultTab) {
    setActiveTab(defaultTab);
  }
});
