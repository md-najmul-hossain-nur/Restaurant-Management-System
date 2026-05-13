// ==========================================
// Feliciano Customer Dashboard - Final Merged Logic
// ==========================================

const TAX_RATE = 0.10;
const EXTRA_PRICE = 0.50;

const cart = new Map();
let pendingItem = null;

// DOM Elements
const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.querySelector('.cart-title span');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartTaxEl = document.getElementById('cartTax');
const cartTotalEl = document.getElementById('cartTotal');
const orderNowBtn = document.querySelector('.order-now-btn');
const orderCancelBtn = document.querySelector('.order-cancel-btn');
const orderToast = document.getElementById('orderToast');

const customizeOverlay = document.getElementById('customizeOverlay');
const customizeItemName = document.getElementById('customizeItemName');
const customizeExtraPrice = document.getElementById('customizeExtraPrice');
const customizeAddBtn = document.querySelector('[data-customize-add]');
const customizeCancelBtn = document.querySelector('[data-customize-cancel]');
const customizeCloseBtn = document.querySelector('[data-customize-close]');

const paymentOverlay = document.getElementById('paymentOverlay');
const paymentTotalEl = document.getElementById('paymentTotal');
const confirmOrderBtn = document.getElementById('confirmOrderBtn');
const paymentCloseBtn = document.querySelector('.payment-close');

const formatMoney = (amount) => `$${amount.toFixed(2)}`;

const getSelectedOptions = () => {
  return Array.from(document.querySelectorAll('.customize-option input:checked'))
    .map(input => input.closest('.customize-option').querySelector('span').textContent.trim());
};

const updateCustomizeExtras = () => {
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
  const { subtotal, tax, total } = calculateTotals();
  if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(subtotal);
  if (cartTaxEl) cartTaxEl.textContent = formatMoney(tax);
  if (cartTotalEl) cartTotalEl.textContent = formatMoney(total);
};

const renderCart = () => {
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
  cartCountEl.textContent = `(${totalQty})`;
  document.querySelector('.cart-panel').classList.toggle('has-items', totalQty > 0);

  const hasItems = totalQty > 0;
  orderNowBtn.disabled = !hasItems;
  orderCancelBtn.disabled = !hasItems;

  updateSummary();
};

const addItemToCart = (name, basePrice, image, options) => {
  const extrasText = options.join(', ');
  const unitPrice = basePrice + (options.length * EXTRA_PRICE);
  const key = `${name}||${extrasText}`;

  if (cart.has(key)) {
    cart.get(key).qty += 1;
  } else {
    cart.set(key, { key, name, basePrice, unitPrice, extrasText, qty: 1, image });
  }
  renderCart();
};

const openCustomize = (card) => {
  const name = card.querySelector('.card-name').textContent.trim();
  const basePrice = parseFloat(card.querySelector('.card-price').textContent.replace(/[^0-9.]/g, '')) || 0;
  const image = card.querySelector('.card-img').style.backgroundImage
                  .replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

  pendingItem = { name, basePrice, image };
  customizeItemName.textContent = name;
  updateCustomizeExtras();
  customizeOverlay.classList.add('is-visible');
};

const closeCustomize = () => {
  customizeOverlay.classList.remove('is-visible');
  pendingItem = null;
};

const buildDetailedBill = () => {
  let text = "Feliciano Restaurant\nOrder Receipt\n";
  text += `Date: ${new Date().toLocaleString()}\n`;
  text += "=".repeat(50) + "\n\n";

  cart.forEach(item => {
    const baseTotal = item.basePrice * item.qty;
    const extrasTotal = (item.unitPrice - item.basePrice) * item.qty;
    text += `${item.name} × ${item.qty}\n`;
    text += `   Base      ${formatMoney(item.basePrice)} × ${item.qty} = ${formatMoney(baseTotal)}\n`;
    if (item.extrasText) {
      text += `   Extras    ${item.extrasText}\n`;
      text += `             ${formatMoney(item.unitPrice - item.basePrice)} × ${item.qty} = ${formatMoney(extrasTotal)}\n`;
    }
    text += `   Item Total: ${formatMoney(item.unitPrice * item.qty)}\n\n`;
  });

  const { subtotal, tax, total } = calculateTotals();
  text += "=".repeat(50) + "\n";
  text += `Subtotal : ${formatMoney(subtotal)}\n`;
  text += `Tax 10%  : ${formatMoney(tax)}\n`;
  text += `TOTAL    : ${formatMoney(total)}\n`;
  text += "=".repeat(50) + "\n";
  text += "Thank you for choosing Feliciano!";

  return text;
};

// ====================== EVENT LISTENERS ======================

// Category Filter
document.querySelectorAll('.cat-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const category = btn.textContent.trim();
    document.querySelectorAll('.menu-card').forEach(card => {
      const tag = card.querySelector('.card-tag').textContent.trim();
      card.style.display = (category === 'All' || tag === category) ? 'flex' : 'none';
    });
  });
});

// Add to Cart
document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.menu-card');
    if (card) openCustomize(card);
  });
});

// Customize Modal
customizeAddBtn.addEventListener('click', () => {
  if (pendingItem) {
    addItemToCart(pendingItem.name, pendingItem.basePrice, pendingItem.image, getSelectedOptions());
    closeCustomize();
  }
});

customizeCancelBtn.addEventListener('click', closeCustomize);
customizeCloseBtn.addEventListener('click', closeCustomize);

// Cart Quantity Controls
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

// Order Now Button
orderNowBtn.addEventListener('click', () => {
  if (cart.size === 0) return;
  paymentTotalEl.textContent = formatMoney(calculateTotals().total);
  paymentOverlay.classList.add('is-visible');
});

// Clear Cart
orderCancelBtn.addEventListener('click', () => {
  if (cart.size === 0) return;
  if (confirm("Clear entire cart?")) {
    cart.clear();
    renderCart();
    showToast("Cart cleared");
  }
});

// ==================== MAIN CONFIRM ORDER LOGIC ====================
confirmOrderBtn.addEventListener('click', () => {
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  const billText = buildDetailedBill();

  if (method === "Online") {
    // Ask user if they want to download the bill
    if (confirm("Do you want to download the bill receipt?")) {
      const blob = new Blob([billText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feliciano-receipt-${new Date().toISOString().slice(0,10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Receipt downloaded successfully!");
    } else {
      showToast("Order placed successfully!");
    }
  } else {
    // Cash on Delivery
    showToast("Order placed successfully! Cash on Delivery.");
  }

  paymentOverlay.classList.remove('is-visible');
  cart.clear();
  renderCart();
});

// Close handlers
paymentCloseBtn.addEventListener('click', () => paymentOverlay.classList.remove('is-visible'));
document.querySelector('[data-payment-cancel]').addEventListener('click', () => paymentOverlay.classList.remove('is-visible'));

// Close overlays when clicking outside
paymentOverlay.addEventListener('click', e => {
  if (e.target === paymentOverlay) paymentOverlay.classList.remove('is-visible');
});
customizeOverlay.addEventListener('click', e => {
  if (e.target === customizeOverlay) closeCustomize();
});

// Escape key support
document.addEventListener('keydown', e => {
  if (e.key === "Escape") {
    if (customizeOverlay.classList.contains('is-visible')) closeCustomize();
    if (paymentOverlay.classList.contains('is-visible')) paymentOverlay.classList.remove('is-visible');
  }
});

// Extras checkbox listener
document.querySelectorAll('.customize-option input').forEach(cb => {
  cb.addEventListener('change', updateCustomizeExtras);
});

// Initialize
renderCart();