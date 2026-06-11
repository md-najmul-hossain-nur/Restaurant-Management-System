// ==========================================
// Feliciano Customer Dashboard
// ==========================================

const TAX_RATE = 0.10;
const EXTRA_PRICE = 0.50;

const cart = new Map();
let pendingItem = null;

// Utilities
const formatMoney = (amount) => `$${amount.toFixed(2)}`;

const normalizeImagePath = (path) => {
  if (!path) return '../Images/food/default.png';
  if (path.startsWith('http') || path.startsWith('..')) return path;
  return `../${path.replace(/^\/+/, '')}`;
};

const getSelectedOptions = () => {
  return Array.from(document.querySelectorAll('.customize-option input:checked'))
    .map(input => input.closest('.customize-option').querySelector('span').textContent.trim());
};

const updateCustomizeExtras = () => {
  const customizeExtraPrice = document.getElementById('customizeExtraPrice');
  const count = getSelectedOptions().length;
  const extrasCost = count * EXTRA_PRICE;
  const basePrice = pendingItem ? pendingItem.basePrice : 0;
  const total = basePrice + extrasCost;
  if (customizeExtraPrice) {
    customizeExtraPrice.innerHTML =
      `<span class="customize-extras-line">Extras: <strong>${formatMoney(extrasCost)}</strong></span>` +
      `<span class="customize-total-line">Total: <strong>${formatMoney(total)}</strong></span>`;
  }
};

const showToast = (message) => {
  const orderToast = document.getElementById('orderToast');
  if (!orderToast) return;
  orderToast.innerHTML = `<i class="fas fa-check"></i><span>${message}</span>`;
  orderToast.classList.add('is-visible');
  setTimeout(() => orderToast.classList.remove('is-visible'), 2500);
};

const calculateTotals = () => {
  let subtotal = 0;
  cart.forEach(item => subtotal += item.unitPrice * item.qty);
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
};

const updateSummary = () => {
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartTaxEl      = document.getElementById('cartTax');
  const cartTotalEl    = document.getElementById('cartTotal');
  const { subtotal, tax, total } = calculateTotals();
  if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(subtotal);
  if (cartTaxEl)      cartTaxEl.textContent      = formatMoney(tax);
  if (cartTotalEl)    cartTotalEl.textContent     = formatMoney(total);
};

// Cart Rendering
const renderCart = () => {
  const cartItemsEl    = document.getElementById('cartItems');
  const cartCountEl    = document.querySelector('.cart-title span');
  const orderNowBtn    = document.querySelector('.order-now-btn');
  const orderCancelBtn = document.querySelector('.order-cancel-btn');
  const cartPanel      = document.querySelector('.cart-panel');

  if (!cartItemsEl) return;

  cartItemsEl.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.dataset.itemKey = item.key;
    div.innerHTML = `
      <div class="cart-item-main">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          ${item.extrasText ? `<span class="cart-item-extras">Extras: ${item.extrasText}</span>` : ''}
          <span class="cart-item-price">${formatMoney(item.unitPrice)}</span>
        </div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-action="minus">-</button>
        <span class="qty-count">${item.qty}</span>
        <button class="qty-btn" data-action="plus">+</button>
      </div>
    `;
    cartItemsEl.appendChild(div);
  });

  const totalQty = Array.from(cart.values()).reduce((sum, i) => sum + i.qty, 0);
  if (cartCountEl) cartCountEl.textContent = `(${totalQty})`;
  if (cartPanel)   cartPanel.classList.toggle('has-items', totalQty > 0);

  const hasItems = totalQty > 0;
  if (orderNowBtn)    orderNowBtn.disabled    = !hasItems;
  if (orderCancelBtn) orderCancelBtn.disabled = !hasItems;

  updateSummary();
};

// Cart Operations
const addItemToCart = (name, basePrice, image, options, recipeId) => {
  const extrasText = options.join(', ');
  const unitPrice  = basePrice + (options.length * EXTRA_PRICE);
  const key        = `${name}||${extrasText}`;

  if (cart.has(key)) {
    cart.get(key).qty += 1;
  } else {
    cart.set(key, { key, name, basePrice, unitPrice, extrasText, qty: 1, image, recipeId });
  }
  renderCart();
};

// Customize Modal
const openCustomize = (card) => {
  const customizeOverlay  = document.getElementById('customizeOverlay');
  const customizeItemName = document.getElementById('customizeItemName');

  if (!customizeOverlay || !customizeItemName) {
    console.error('Customize overlay elements not found in DOM');
    return;
  }

  const nameEl      = card.querySelector('.card-name');
  const priceEl     = card.querySelector('.card-price');

  if (!nameEl || !priceEl) {
    console.error('Card is missing .card-name or .card-price element', card);
    return;
  }

  const name      = nameEl.textContent.trim();
  const basePrice = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0;
  const image     = card.dataset.image || '';
  const recipeId  = parseInt(card.dataset.recipeId) || null;

  document.querySelectorAll('.customize-option input').forEach(cb => cb.checked = false);

  pendingItem = { name, basePrice, image, recipeId };
  customizeItemName.textContent = name;
  updateCustomizeExtras();
  customizeOverlay.classList.add('is-visible');
};

const closeCustomize = () => {
  const customizeOverlay = document.getElementById('customizeOverlay');
  if (customizeOverlay) customizeOverlay.classList.remove('is-visible');
  pendingItem = null;
};

// ==========================================
// Load Menu
// ==========================================

async function loadMenu(category = 'All') {
  const grid = document.querySelector('.menu-grid');
  if (!grid) return;

  grid.innerHTML = '<p style="color:#aaa;padding:1rem;">Loading menu…</p>';

  try {
    let url = '../api/get_menu.php';
    if (category !== 'All') {
      url += `?category=${encodeURIComponent(category)}`;
    }

    console.log('Trying to fetch:', url);

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const recipes = await res.json();
    console.log('✅ Menu loaded successfully!', recipes.length, 'items');

    if (!Array.isArray(recipes) || recipes.length === 0) {
      grid.innerHTML = '<p style="color:#aaa;padding:1rem;">No items available yet.</p>';
      return;
    }

    grid.innerHTML = recipes.map(recipe => {
      const normalizedPath = normalizeImagePath(recipe.image_path);
      return `
      <div class="menu-card"
           data-recipe-id="${recipe.id}"
           data-image="${normalizedPath}">
        <div class="card-img"
             style="background-image:url('${normalizedPath}')">
          <span class="card-tag">${recipe.category || 'Other'}</span>
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <span class="card-name">${recipe.name}</span>
            <span class="card-price">$${parseFloat(recipe.price).toFixed(2)}</span>
          </div>
          <p class="card-desc">${recipe.description || ''}</p>
          <div class="card-footer">
            <button class="add-btn">Add To Cart</button>
          </div>
        </div>
      </div>
      `;
    }).join('');

    attachAddToCartListeners();

  } catch (err) {
    console.error('Failed to load menu:', err);
    grid.innerHTML = `<p style="color:#e07070;padding:1rem;">Could not load menu.<br><small>${err.message}</small></p>`;
  }
}

// Place Order
async function placeOrderInDB(paymentMethod) {
  const tableId = sessionStorage.getItem('selectedTableId') || null;

  const items = Array.from(cart.values()).map(item => ({
    recipe_id: item.recipeId,
    name:      item.name,
    price:     item.unitPrice,
    quantity:  item.qty,
  }));

  const res = await fetch('../api/place_order.php', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table_id:       tableId,
      payment_method: paymentMethod,
      items,
    }),
  });

  // FIX: check HTTP status before trying to parse JSON
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Server returned ${res.status}: ${errorText}`);
  }

  return await res.json();
}

// PDF Function
const downloadBillAsPDF = () => {
  // FIX: guard against jsPDF not being loaded
  if (!window.jspdf || !window.jspdf.jsPDF) {
    console.error('jsPDF library is not loaded');
    showToast('PDF library not available. Order placed successfully.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth    = doc.internal.pageSize.getWidth();
  const margin       = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const { subtotal, tax, total } = calculateTotals();

  // FIX: guard against no payment method selected
  const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
  const method  = paymentMethodEl ? paymentMethodEl.value : 'N/A';
  const dateStr = new Date().toLocaleString();

  doc.setFillColor(30, 32, 28);
  doc.rect(0, 0, pageWidth, 38, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(200, 169, 106);
  doc.text('FELICIANO', pageWidth / 2, 16, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text('Order Receipt', pageWidth / 2, 24, { align: 'center' });
  doc.text(dateStr, pageWidth / 2, 30, { align: 'center' });

  y = 48;

  doc.setFillColor(200, 169, 106);
  doc.roundedRect(margin, y - 5, 50, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Payment: ${method}`, margin + 25, y, { align: 'center' });
  y += 12;

  doc.setDrawColor(200, 169, 106);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM',  margin, y);
  doc.text('QTY',   margin + contentWidth * 0.55, y, { align: 'center' });
  doc.text('UNIT',  margin + contentWidth * 0.72, y, { align: 'center' });
  doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });
  y += 4;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  cart.forEach(item => {
    const rowTotal = item.unitPrice * item.qty;
    doc.setFillColor(248, 248, 248);
    doc.rect(margin - 2, y - 4, contentWidth + 4, 14, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name, margin, y);
    if (item.extrasText) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      const wrapped = doc.splitTextToSize(`+ ${item.extrasText}`, contentWidth * 0.5);
      doc.text(wrapped, margin, y + 4);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(`${item.qty}`, margin + contentWidth * 0.55, y, { align: 'center' });
    doc.text(formatMoney(item.unitPrice), margin + contentWidth * 0.72, y, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(rowTotal), pageWidth - margin, y, { align: 'right' });
    y += item.extrasText ? 16 : 12;
    if (y > 250) { doc.addPage(); y = 20; }
  });

  y += 2;
  doc.setDrawColor(200, 169, 106);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  const summaryX = pageWidth - margin - 60;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Subtotal:', summaryX, y);
  doc.text(formatMoney(subtotal), pageWidth - margin, y, { align: 'right' });
  y += 6;
  doc.text('Tax (10%):', summaryX, y);
  doc.text(formatMoney(tax), pageWidth - margin, y, { align: 'right' });
  y += 6;

  doc.setFillColor(200, 169, 106);
  doc.rect(summaryX - 4, y - 4, contentWidth - (summaryX - margin) + 4 + 4, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', summaryX, y + 2);
  doc.text(formatMoney(total), pageWidth - margin, y + 2, { align: 'right' });
  y += 16;

  doc.setDrawColor(200, 169, 106);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for choosing Feliciano!', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(7.5);
  doc.text('Please retain this receipt for your records.', pageWidth / 2, y, { align: 'center' });

  const filename = `feliciano-receipt-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

function attachAddToCartListeners() {
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.menu-card');
      if (card) openCustomize(card);
    });
  });
}

// ==========================================
// All event listeners inside DOMContentLoaded
// FIX: this ensures no DOM element is null when listeners are attached
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

  // Category buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadMenu(btn.textContent.trim());
    });
  });

  // Customize modal
  const customizeAddBtn    = document.querySelector('[data-customize-add]');
  const customizeCancelBtn = document.querySelector('[data-customize-cancel]');
  const customizeCloseBtn  = document.querySelector('[data-customize-close]');
  const customizeOverlay   = document.getElementById('customizeOverlay');

  if (customizeAddBtn) {
    customizeAddBtn.addEventListener('click', () => {
      if (pendingItem) {
        addItemToCart(pendingItem.name, pendingItem.basePrice, pendingItem.image, getSelectedOptions(), pendingItem.recipeId);
        closeCustomize();
        showToast(`${pendingItem.name} added to cart`);
      }
    });
  }

  if (customizeCancelBtn) customizeCancelBtn.addEventListener('click', closeCustomize);
  if (customizeCloseBtn)  customizeCloseBtn.addEventListener('click', closeCustomize);

  document.querySelectorAll('.customize-option input').forEach(cb => cb.addEventListener('change', updateCustomizeExtras));

  if (customizeOverlay) {
    customizeOverlay.addEventListener('click', e => {
      if (e.target === customizeOverlay) closeCustomize();
    });
  }

  // Cart qty buttons
  const cartItemsEl = document.getElementById('cartItems');
  if (cartItemsEl) {
    cartItemsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.qty-btn');
      if (!btn) return;
      const itemEl = btn.closest('.cart-item');
      const key = itemEl.dataset.itemKey;
      if (!cart.has(key)) return;
      const item = cart.get(key);
      if (btn.dataset.action === 'plus') item.qty++;
      else item.qty--;
      if (item.qty <= 0) cart.delete(key);
      renderCart();
    });
  }

  // Order now button
  const orderNowBtn = document.querySelector('.order-now-btn');
  if (orderNowBtn) {
    orderNowBtn.addEventListener('click', () => {
      if (cart.size === 0) return;
      const paymentTotalEl = document.getElementById('paymentTotal');
      const paymentOverlay = document.getElementById('paymentOverlay');
      if (paymentTotalEl) paymentTotalEl.textContent = formatMoney(calculateTotals().total);
      if (paymentOverlay) paymentOverlay.classList.add('is-visible');
    });
  }

  // Order cancel button
  const orderCancelBtn = document.querySelector('.order-cancel-btn');
  if (orderCancelBtn) {
    orderCancelBtn.addEventListener('click', () => {
      if (cart.size === 0) return;
      if (confirm('Clear entire cart?')) {
        cart.clear();
        renderCart();
        showToast('Cart cleared');
      }
    });
  }

  // Confirm order button
  const confirmOrderBtn = document.getElementById('confirmOrderBtn');
  const paymentOverlay  = document.getElementById('paymentOverlay');

  if (confirmOrderBtn) {
    confirmOrderBtn.addEventListener('click', async () => {
      if (cart.size === 0) return;

      // FIX: guard against no payment method selected
      const paymentMethodEl = document.querySelector('input[name="paymentMethod"]:checked');
      if (!paymentMethodEl) {
        showToast('Please select a payment method.');
        return;
      }
      const method = paymentMethodEl.value;

      confirmOrderBtn.disabled = true;
      confirmOrderBtn.textContent = 'Placing order…';

      try {
        const result = await placeOrderInDB(method);
        if (result.success) {
          downloadBillAsPDF();
          if (paymentOverlay) paymentOverlay.classList.remove('is-visible');
          cart.clear();
          renderCart();
          showToast(`Order #${result.order_id} placed!`);
        } else {
          showToast(`Error: ${result.error || 'Failed to place order'}`);
        }
      } catch (err) {
        console.error(err);
        showToast(`Error: ${err.message || 'Network error. Try again.'}`);
      } finally {
        confirmOrderBtn.disabled = false;
        confirmOrderBtn.textContent = 'Confirm Order';
      }
    });
  }

  // Payment overlay close buttons
  const paymentCloseBtn  = document.querySelector('.payment-close');
  const paymentCancelBtn = document.querySelector('[data-payment-cancel]');

  if (paymentCloseBtn)  paymentCloseBtn.addEventListener('click', () => paymentOverlay && paymentOverlay.classList.remove('is-visible'));
  if (paymentCancelBtn) paymentCancelBtn.addEventListener('click', () => paymentOverlay && paymentOverlay.classList.remove('is-visible'));

  if (paymentOverlay) {
    paymentOverlay.addEventListener('click', e => {
      if (e.target === paymentOverlay) paymentOverlay.classList.remove('is-visible');
    });
  }

  // Escape key
  document.addEventListener('keydown', e => {
    const customizeOverlayEl = document.getElementById('customizeOverlay');
    const paymentOverlayEl   = document.getElementById('paymentOverlay');
    if (e.key === 'Escape') {
      if (customizeOverlayEl && customizeOverlayEl.classList.contains('is-visible')) closeCustomize();
      if (paymentOverlayEl && paymentOverlayEl.classList.contains('is-visible')) paymentOverlayEl.classList.remove('is-visible');
    }
  });

  // Initialize
  loadMenu();
  renderCart();
});