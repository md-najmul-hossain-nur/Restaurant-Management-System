const catBtns = document.querySelectorAll('.cat-btn');
const menuCards = document.querySelectorAll('.menu-card');

catBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button
    catBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const selected = btn.textContent.trim();

    menuCards.forEach((card, i) => {
      const tag = card.querySelector('.card-tag').textContent.trim();
      const show = selected === 'All' || tag === selected;

      if (show) {
        card.style.display = 'flex';
        // Re-trigger fade animation
        card.style.animation = 'none';
        card.offsetHeight; // force reflow
        card.style.animation = `fadeUp 0.25s ease ${i * 0.03}s both`;
      } else {
        card.style.display = 'none';
      }
    });
  });
});

const addButtons = document.querySelectorAll('.add-btn');
const cartPanel = document.querySelector('.cart-panel');
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
const paymentTotal = document.getElementById('paymentTotal');
const paymentConfirmBtn = document.querySelector('[data-payment-confirm]');
const paymentCancelBtn = document.querySelector('[data-payment-cancel]');
const paymentDownloadBtn = document.querySelector('[data-payment-download]');
const paymentCloseBtn = document.querySelector('.payment-close');

const TAX_RATE = 0.10;
const EXTRA_OPTION_PRICE = 0.50;
const cart = new Map();
let pendingItem = null;

const formatMoney = amount => `$${amount.toFixed(2)}`;

const getSelectedOptions = () => Array.from(document.querySelectorAll('.customize-option input:checked'))
  .map(input => input.closest('.customize-option')?.textContent.trim())
  .filter(Boolean);

const updateCustomizeExtras = () => {
  if (!customizeExtraPrice) return;
  const count = getSelectedOptions().length;
  const extrasCost = count * EXTRA_OPTION_PRICE;
  customizeExtraPrice.textContent = `Extras: ${formatMoney(extrasCost)}`;
};

const showOrderToast = () => {
  if (!orderToast) return;
  orderToast.classList.add('is-visible');
  setTimeout(() => {
    orderToast.classList.remove('is-visible');
  }, 1800);
};

const updateSummary = () => {
  const subtotal = Array.from(cart.values()).reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  if (cartSubtotalEl) cartSubtotalEl.textContent = formatMoney(subtotal);
  if (cartTaxEl) cartTaxEl.textContent = formatMoney(tax);
  if (cartTotalEl) cartTotalEl.textContent = formatMoney(total);
};

const renderCart = () => {
  if (!cartItemsEl) return;
  cartItemsEl.innerHTML = '';

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.dataset.itemKey = item.key;
    row.innerHTML = `
      <div class="cart-item-main">
        <img class="cart-item-img" src="${item.image}" alt="${item.name}" />
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          ${item.extrasText ? `<span class="cart-item-extras">Extras: ${item.extrasText}</span>` : ''}
          <span class="cart-item-price">${formatMoney(item.unitPrice)}</span>
        </div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" type="button" data-qty="minus">-</button>
        <span class="qty-count">${item.qty}</span>
        <button class="qty-btn" type="button" data-qty="plus">+</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });

  const totalCount = Array.from(cart.values()).reduce((sum, item) => sum + item.qty, 0);
  if (cartCountEl) cartCountEl.textContent = `(${totalCount})`;

  if (cartPanel) cartPanel.classList.toggle('has-items', totalCount > 0);
  if (orderNowBtn) orderNowBtn.disabled = totalCount === 0;
  if (orderCancelBtn) orderCancelBtn.disabled = totalCount === 0;

  updateSummary();
};

const addItemToCart = (name, basePrice, image, options) => {
  if (!name) return;
  const extrasText = options.length ? options.join(', ') : '';
  const extrasCost = options.length * EXTRA_OPTION_PRICE;
  const unitPrice = basePrice + extrasCost;
  const key = `${name}||${extrasText}`;
  const existing = cart.get(key);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.set(key, {
      key,
      name,
      basePrice,
      unitPrice,
      extrasText,
      qty: 1,
      image
    });
  }
  renderCart();
};

addButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.menu-card');
    if (!card) return;
    const name = card.querySelector('.card-name')?.textContent.trim() || '';
    const priceText = card.querySelector('.card-price')?.textContent.trim() || '$0';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
    const image = card.querySelector('.card-img')?.style.backgroundImage
      .replace(/^url\(["']?/, '')
      .replace(/["']?\)$/, '') || '';
    pendingItem = { name, price, image };
    if (customizeItemName) customizeItemName.textContent = name;
    updateCustomizeExtras();
    if (customizeOverlay) {
      customizeOverlay.classList.add('is-visible');
      customizeOverlay.setAttribute('aria-hidden', 'false');
    }
  });
});

const closeCustomize = () => {
  if (!customizeOverlay) return;
  customizeOverlay.classList.remove('is-visible');
  customizeOverlay.setAttribute('aria-hidden', 'true');
};

if (customizeAddBtn) {
  customizeAddBtn.addEventListener('click', () => {
    if (!pendingItem) return;
    const options = getSelectedOptions();
    addItemToCart(pendingItem.name, pendingItem.price, pendingItem.image, options);
    pendingItem = null;
    closeCustomize();
  });
}

if (customizeCancelBtn) {
  customizeCancelBtn.addEventListener('click', () => {
    pendingItem = null;
    closeCustomize();
  });
}

if (customizeCloseBtn) {
  customizeCloseBtn.addEventListener('click', () => {
    pendingItem = null;
    closeCustomize();
  });
}

if (customizeOverlay) {
  customizeOverlay.addEventListener('click', e => {
    if (e.target === customizeOverlay) {
      pendingItem = null;
      closeCustomize();
    }
  });
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && customizeOverlay?.classList.contains('is-visible')) {
    pendingItem = null;
    closeCustomize();
  }
  if (e.key === 'Escape' && paymentOverlay?.classList.contains('is-visible')) {
    closePayment();
  }
});

document.querySelectorAll('.customize-option input').forEach(input => {
  input.addEventListener('change', updateCustomizeExtras);
});

document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
  input.addEventListener('change', () => {
    if (paymentDownloadBtn) paymentDownloadBtn.style.display = 'block';
  });
});

const openPayment = () => {
  if (!paymentOverlay) return;
  if (paymentTotal && cartTotalEl) paymentTotal.textContent = cartTotalEl.textContent;
  paymentOverlay.classList.add('is-visible');
  paymentOverlay.setAttribute('aria-hidden', 'false');
  // Show download button if payment method is selected
  const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked');
  if (selectedPayment && paymentDownloadBtn) paymentDownloadBtn.style.display = 'block';
};

const closePayment = () => {
  if (!paymentOverlay) return;
  paymentOverlay.classList.remove('is-visible');
  paymentOverlay.setAttribute('aria-hidden', 'true');
};

const buildBillText = () => {
  const lines = [];
  lines.push('Feliciano - Order Receipt');
  lines.push('');
  cart.forEach(item => {
    const extras = item.extrasText ? ` (Extras: ${item.extrasText})` : '';
    lines.push(`${item.name}${extras} x${item.qty} - ${formatMoney(item.unitPrice * item.qty)}`);
  });
  lines.push('');
  lines.push(`Subtotal: ${cartSubtotalEl?.textContent || '$0.00'}`);
  lines.push(`Tax: ${cartTaxEl?.textContent || '$0.00'}`);
  lines.push(`Total: ${cartTotalEl?.textContent || '$0.00'}`);
  return lines.join('\n');
};

if (cartItemsEl) {
  cartItemsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-qty]');
    if (!btn) return;
    const itemEl = btn.closest('.cart-item');
    const key = itemEl?.dataset.itemKey;
    if (!key || !cart.has(key)) return;
    const item = cart.get(key);
    if (btn.dataset.qty === 'plus') item.qty += 1;
    if (btn.dataset.qty === 'minus') item.qty -= 1;
    if (item.qty <= 0) cart.delete(key);
    renderCart();
  });
}

if (orderCancelBtn) {
  orderCancelBtn.addEventListener('click', () => {
    if (cart.size === 0) return;
    cart.clear();
    renderCart();
    showOrderToast();
  });
}

if (orderNowBtn) {
  orderNowBtn.addEventListener('click', () => {
    if (cart.size === 0) return;
    openPayment();
  });
}

if (paymentCancelBtn) {
  paymentCancelBtn.addEventListener('click', closePayment);
}

if (paymentCloseBtn) {
  paymentCloseBtn.addEventListener('click', closePayment);
}

if (paymentDownloadBtn) {
  paymentDownloadBtn.addEventListener('click', () => {
    if (cart.size === 0) return;
    const blob = new Blob([buildBillText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feliciano-bill.txt';
    link.click();
    URL.revokeObjectURL(url);
    closePayment();
    cart.clear();
    renderCart();
    showOrderToast();
  });
}

if (paymentOverlay) {
  paymentOverlay.addEventListener('click', e => {
    if (e.target === paymentOverlay) closePayment();
  });
}

renderCart();