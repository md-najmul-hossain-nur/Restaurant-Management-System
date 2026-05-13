// ==========================================
// Feliciano Customer Dashboard
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
const paymentCancelBtn = document.querySelector('[data-payment-cancel]');

// ==========================================
// Utilities
// ==========================================

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

// ==========================================
// Cart Rendering
// ==========================================

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

// ==========================================
// Cart Operations
// ==========================================

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

// ==========================================
// Customize Modal
// ==========================================

const openCustomize = (card) => {
  const name = card.querySelector('.card-name').textContent.trim();
  const basePrice = parseFloat(card.querySelector('.card-price').textContent.replace(/[^0-9.]/g, '')) || 0;
  const image = card.querySelector('.card-img').style.backgroundImage
                  .replace(/^url\(["']?/, '').replace(/["']?\)$/, '');

  // Reset all checkboxes to unchecked before opening
  document.querySelectorAll('.customize-option input').forEach(cb => cb.checked = false);

  pendingItem = { name, basePrice, image };
  customizeItemName.textContent = name;
  updateCustomizeExtras();
  customizeOverlay.classList.add('is-visible');
};

const closeCustomize = () => {
  customizeOverlay.classList.remove('is-visible');
  pendingItem = null;
};

// ==========================================
// PDF Bill Generation
// ==========================================

const downloadBillAsPDF = () => {
  // jsPDF is loaded from CDN (must be included in HTML head)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  const { subtotal, tax, total } = calculateTotals();
  const method = document.querySelector('input[name="paymentMethod"]:checked').value;
  const dateStr = new Date().toLocaleString();

  // ---- Header ----
  doc.setFillColor(30, 32, 28);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(200, 169, 106); // accent gold
  doc.text('FELICIANO', pageWidth / 2, 16, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text('Order Receipt', pageWidth / 2, 24, { align: 'center' });
  doc.text(dateStr, pageWidth / 2, 30, { align: 'center' });

  y = 48;

  // ---- Payment Method Badge ----
  doc.setFillColor(200, 169, 106);
  doc.roundedRect(margin, y - 5, 50, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Payment: ${method}`, margin + 25, y, { align: 'center' });

  y += 12;

  // ---- Divider ----
  doc.setDrawColor(200, 169, 106);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // ---- Column Headers ----
  doc.setFillColor(245, 237, 224, 0.1);
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM', margin, y);
  doc.text('QTY', margin + contentWidth * 0.55, y, { align: 'center' });
  doc.text('UNIT', margin + contentWidth * 0.72, y, { align: 'center' });
  doc.text('TOTAL', pageWidth - margin, y, { align: 'right' });
  y += 4;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ---- Line Items ----
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  cart.forEach(item => {
    const rowTotal = item.unitPrice * item.qty;

    // Alternate row shading
    doc.setFillColor(248, 248, 248);
    doc.rect(margin - 2, y - 4, contentWidth + 4, 14, 'F');

    // Item name
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(item.name, margin, y);

    // Extras (below name)
    if (item.extrasText) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      const extrasLabel = `+ ${item.extrasText}`;
      const wrapped = doc.splitTextToSize(extrasLabel, contentWidth * 0.5);
      doc.text(wrapped, margin, y + 4);
    }

    // Qty, unit price, total
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(`${item.qty}`, margin + contentWidth * 0.55, y, { align: 'center' });
    doc.text(formatMoney(item.unitPrice), margin + contentWidth * 0.72, y, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(rowTotal), pageWidth - margin, y, { align: 'right' });

    y += item.extrasText ? 16 : 12;

    // Page overflow guard
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  y += 2;

  // ---- Summary Divider ----
  doc.setDrawColor(200, 169, 106);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ---- Subtotal / Tax / Total ----
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

  // Total row with accent background
  doc.setFillColor(200, 169, 106);
  doc.rect(summaryX - 4, y - 4, contentWidth - (summaryX - margin) + 4 + 4, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL:', summaryX, y + 2);
  doc.text(formatMoney(total), pageWidth - margin, y + 2, { align: 'right' });
  y += 16;

  // ---- Footer ----
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

  // Save
  const filename = `feliciano-receipt-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};

// ==========================================
// Event Listeners
// ==========================================

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

// Add to Cart — opens customize modal
document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.menu-card');
    if (card) openCustomize(card);
  });
});

// Customize: Add to Cart
customizeAddBtn.addEventListener('click', () => {
  if (pendingItem) {
    addItemToCart(pendingItem.name, pendingItem.basePrice, pendingItem.image, getSelectedOptions());
    closeCustomize();
    showToast(`${pendingItem.name} added to cart`);
  }
});

customizeCancelBtn.addEventListener('click', closeCustomize);
customizeCloseBtn.addEventListener('click', closeCustomize);

// Extras checkbox live update
document.querySelectorAll('.customize-option input').forEach(cb => {
  cb.addEventListener('change', updateCustomizeExtras);
});

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

// Order Now — open payment modal
orderNowBtn.addEventListener('click', () => {
  if (cart.size === 0) return;
  paymentTotalEl.textContent = formatMoney(calculateTotals().total);
  paymentOverlay.classList.add('is-visible');
});

// Clear Cart
orderCancelBtn.addEventListener('click', () => {
  if (cart.size === 0) return;
  if (confirm('Clear entire cart?')) {
    cart.clear();
    renderCart();
    showToast('Cart cleared');
  }
});

// ==========================================
// Confirm Order — Main Logic
// ==========================================
confirmOrderBtn.addEventListener('click', () => {
  if (cart.size === 0) return;

  const method = document.querySelector('input[name="paymentMethod"]:checked').value;

  // Always download the PDF receipt regardless of payment method
  downloadBillAsPDF();

  // Show appropriate toast
  if (method === 'Online') {
    showToast('Order confirmed! Receipt downloaded.');
  } else {
    showToast('Order placed! Cash on Delivery. Receipt downloaded.');
  }

  // Close modal and clear cart
  paymentOverlay.classList.remove('is-visible');
  cart.clear();
  renderCart();
});

// Close payment modal
paymentCloseBtn.addEventListener('click', () => paymentOverlay.classList.remove('is-visible'));
if (paymentCancelBtn) {
  paymentCancelBtn.addEventListener('click', () => paymentOverlay.classList.remove('is-visible'));
}

// Close overlays on outside click
paymentOverlay.addEventListener('click', e => {
  if (e.target === paymentOverlay) paymentOverlay.classList.remove('is-visible');
});
customizeOverlay.addEventListener('click', e => {
  if (e.target === customizeOverlay) closeCustomize();
});

// Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (customizeOverlay.classList.contains('is-visible')) closeCustomize();
    if (paymentOverlay.classList.contains('is-visible')) paymentOverlay.classList.remove('is-visible');
  }
});

// Initialize
renderCart();