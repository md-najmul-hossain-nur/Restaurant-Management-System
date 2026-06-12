// waiter.js — Feliciano Waiter Dashboard
// Covers: tab nav, clock out, table take/release (DB),
//         new order modal (DB), deliver order (DB), profile modals

document.addEventListener('DOMContentLoaded', () => {

  // ── Tab Navigation ────────────────────────────────────────
  const tabs = document.querySelectorAll('.tab[data-section]');
  const sections = document.querySelectorAll('.section-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (document.body.classList.contains('is-clocked-out')) return;
      const target = tab.dataset.section;
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(target)?.classList.add('active');
    });
  });

  // ── Clock Out ─────────────────────────────────────────────
  const clockBtn = document.querySelector('[data-clock-out]');
  const timerEl = document.getElementById('shiftTimer');
  let shiftTimerInterval = null;

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const clearShiftTimer = () => {
    if (shiftTimerInterval) {
      clearInterval(shiftTimerInterval);
      shiftTimerInterval = null;
    }
  };

  const startShiftTimer = (startTime) => {
    const startObj = new Date(startTime);
    clearShiftTimer();
    const tick = () => {
      const diffInSeconds = Math.floor((Date.now() - startObj.getTime()) / 1000);
      if (timerEl) timerEl.textContent = formatDuration(diffInSeconds >= 0 ? diffInSeconds : 0);
    };
    tick();
    shiftTimerInterval = setInterval(tick, 1000);
  };

  if (clockBtn) {
    const applyState = (out) => {
      document.body.classList.toggle('is-clocked-out', out);
      clockBtn.textContent = out ? 'Clock In' : 'Clock Out';
      if (!out) {
        const lastIn = document.body.dataset.lastClockIn;
        if (lastIn) {
          startShiftTimer(lastIn);
        } else {
          startShiftTimer(new Date().toISOString());
        }
      } else {
        if (timerEl) timerEl.textContent = 'Not clocked in';
        clearShiftTimer();
      }
    };

    const initialClocked = document.body.dataset.clocked === '1';
    document.body.classList.toggle('is-clocked-out', !initialClocked);
    clockBtn.textContent = !initialClocked ? 'Clock In' : 'Clock Out';

    if (initialClocked) {
      const lastIn = document.body.dataset.lastClockIn;
      if (lastIn) startShiftTimer(lastIn);
    } else {
      if (timerEl) timerEl.textContent = 'Not clocked in';
    }

    clockBtn.addEventListener('click', async () => {
      const nextOut = !document.body.classList.contains('is-clocked-out');
      // Optimistically update dataset if we are clocking in
      if (!nextOut) {
        document.body.dataset.lastClockIn = new Date().toISOString();
      }
      applyState(nextOut);
      try {
        await fetch('../api/update_employee_clock.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: nextOut ? 'out' : 'in' }),
        });
      } catch {
        showToast('Clock update failed', true);
      }
    });
  }

  // ── Toast ─────────────────────────────────────────────────
  function showToast(msg, isError = false) {
    const toast = document.getElementById('successToast');
    const msgSpan = toast?.querySelector('.toast-msg');
    if (!toast) return;
    if (msgSpan) msgSpan.textContent = msg;
    const icon = toast?.querySelector('.toast-icon i');
    if (isError) {
      toast.classList.add('error');
      if (icon) icon.className = 'fas fa-exclamation-triangle';
    } else {
      toast.classList.remove('error');
      if (icon) icon.className = 'fas fa-check';
    }
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ── Table Take / Release (DB-connected) ──────────────────
  const myTablesGrid = document.getElementById('myTablesGrid');
  const availTablesGrid = document.getElementById('availTablesGrid');
  const myTableCount = document.getElementById('myTableCount');
  const availTableCount = document.getElementById('availTableCount');

  function updateTableCounts() {
    const myCount = myTablesGrid?.querySelectorAll('.waiter-table-card[data-table-id]').length || 0;
    const availCount = availTablesGrid?.querySelectorAll('.waiter-table-card[data-table-id]').length || 0;
    if (myTableCount) myTableCount.textContent = myCount;
    if (availTableCount) availTableCount.textContent = availCount;
  }

  function ensureEmptyCard(grid, message) {
    if (!grid) return;
    const hasCards = grid.querySelectorAll('.waiter-table-card[data-table-id]').length > 0;
    const emptyCard = grid.querySelector('.waiter-table-card[data-empty="1"]');
    if (hasCards) {
      grid.querySelectorAll('.waiter-table-card:not([data-table-id])').forEach(card => card.remove());
    }
    if (hasCards && emptyCard) {
      emptyCard.remove();
      return;
    }
    if (!hasCards && !emptyCard) {
      const card = document.createElement('div');
      card.className = 'waiter-table-card';
      card.dataset.empty = '1';
      card.innerHTML = `<div class="waiter-table-name">${message}</div>`;
      grid.appendChild(card);
    }
  }

  function updateOrderTableOption(tableId, tableNumber, listKey) {
    const select = document.getElementById('orderTableSelect');
    if (!select) return;
    const optionId = `table-option-${tableId}`;
    let option = select.querySelector(`#${optionId}`);

    if (listKey === 'remove') {
      if (option) option.remove();
      return;
    }

    if (!option) {
      option = document.createElement('option');
      option.id = optionId;
      option.value = tableId;
      option.textContent = `Table ${tableNumber}`;
      select.appendChild(option);
    }
  }

  async function assignTableDB(tableId, action) {
    try {
      const res = await fetch('../api/assign_table.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: tableId, action }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Table update failed');
      }
      return result;
    } catch {
      return null;
    }
  }

  myTablesGrid?.addEventListener('click', async e => {
    const releaseBtn = e.target.closest('[data-release]');
    if (!releaseBtn || !availTablesGrid) return;
    const card = releaseBtn.closest('.waiter-table-card');
    const tableId = releaseBtn.dataset.release;
    const tableNumber = card?.dataset.tableNumber || tableId;

    releaseBtn.classList.replace('waiter-table-action--release', 'waiter-table-action--take');
    releaseBtn.textContent = 'Take Table';
    releaseBtn.removeAttribute('data-release');
    releaseBtn.setAttribute('data-take', tableId);

    availTablesGrid.appendChild(card);
    updateTableCounts();
    ensureEmptyCard(myTablesGrid, 'No assigned tables');
    ensureEmptyCard(availTablesGrid, 'No available tables');

    const result = await assignTableDB(tableId, 'release');
    if (!result) {
      myTablesGrid.appendChild(card);
      releaseBtn.classList.replace('waiter-table-action--take', 'waiter-table-action--release');
      releaseBtn.textContent = 'Release Table';
      releaseBtn.removeAttribute('data-take');
      releaseBtn.setAttribute('data-release', tableId);
      updateTableCounts();
      ensureEmptyCard(myTablesGrid, 'No assigned tables');
      ensureEmptyCard(availTablesGrid, 'No available tables');
      showToast('Table release failed', true);
      return;
    }

    if (result.next_status === 'available') {
      updateOrderTableOption(tableId, tableNumber, 'remove');
    } else {
      card.remove();
      updateOrderTableOption(tableId, tableNumber, 'remove');
      showToast('Table released. It is reserved for a customer.');
    }
    updateTableCounts();
    ensureEmptyCard(myTablesGrid, 'No assigned tables');
    ensureEmptyCard(availTablesGrid, 'No available tables');
  });

  availTablesGrid?.addEventListener('click', async e => {
    const takeBtn = e.target.closest('[data-take]');
    if (!takeBtn || !myTablesGrid) return;
    const card = takeBtn.closest('.waiter-table-card');
    const tableId = takeBtn.dataset.take;
    const tableNumber = card?.dataset.tableNumber || tableId;

    takeBtn.classList.replace('waiter-table-action--take', 'waiter-table-action--release');
    takeBtn.textContent = 'Release Table';
    takeBtn.removeAttribute('data-take');
    takeBtn.setAttribute('data-release', tableId);

    myTablesGrid.appendChild(card);
    updateTableCounts();
    ensureEmptyCard(myTablesGrid, 'No assigned tables');
    ensureEmptyCard(availTablesGrid, 'No available tables');

    const result = await assignTableDB(tableId, 'take');
    if (!result) {
      availTablesGrid.appendChild(card);
      takeBtn.classList.replace('waiter-table-action--release', 'waiter-table-action--take');
      takeBtn.textContent = 'Take Table';
      takeBtn.removeAttribute('data-release');
      takeBtn.setAttribute('data-take', tableId);
      updateTableCounts();
      ensureEmptyCard(myTablesGrid, 'No assigned tables');
      ensureEmptyCard(availTablesGrid, 'No available tables');
      showToast('Table assign failed', true);
      return;
    }

    updateOrderTableOption(tableId, tableNumber, 'add');
  });

  updateTableCounts();
  ensureEmptyCard(myTablesGrid, 'No assigned tables');
  ensureEmptyCard(availTablesGrid, 'No available tables');

  // ── Order Stats ───────────────────────────────────────────
  const orderList = document.querySelector('#order .order-list') ||
    document.querySelector('#order');
  const statPending = document.getElementById('statPending');
  const statProgress = document.getElementById('statProgress');
  const statCompleted = document.getElementById('statCompleted');
  const orderCountEl = document.getElementById('orderCount');

  function updateOrderStats() {
    if (!orderList) return;
    const cards = orderList.querySelectorAll('.order-card[data-order-id]');
    
    let ready = orderList.querySelectorAll('.order-status--ready').length;
    const readyDeliveries = document.getElementById('readyDeliveriesList');
    if (readyDeliveries) {
      ready += readyDeliveries.querySelectorAll('.order-card[data-order-id]').length;
    }
    
    const kitchen = orderList.querySelectorAll('.order-status--kitchen').length;
    if (orderCountEl) orderCountEl.textContent = cards.length;
    if (statPending) statPending.textContent = ready;
    if (statProgress) statProgress.textContent = kitchen;
  }
  updateOrderStats();

  function appendOrderCard(orderId, tableId, itemsSnapshot) {
    if (!orderList) return;

    const select = document.getElementById('orderTableSelect');
    const option = select?.querySelector(`option[value="${tableId}"]`);
    const tableLabel = option?.textContent || `Table ${tableId}`;
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let total = 0;
    const itemsHtml = [];
    const pricesHtml = [];
    itemsSnapshot.forEach(({ qty, price }, name) => {
      total += qty * price;
      itemsHtml.push(`<div>${qty}× ${name}</div>`);
      pricesHtml.push(`<div class="order-price">${qty}× $${price.toFixed(2)} = $${(qty * price).toFixed(2)}</div>`);
    });
    // Same formula as the server (waiter_place_order.php): grand = round(subtotal * 1.10)
    const subtotal = Math.round(total * 100) / 100;
    const grandNum = Math.round(total * 1.10 * 100) / 100;
    const taxNum = Math.round((grandNum - subtotal) * 100) / 100;
    pricesHtml.push(`<div class="order-price">Subtotal: $${subtotal.toFixed(2)}</div>`);
    pricesHtml.push(`<div class="order-price">Tax (10%): $${taxNum.toFixed(2)}</div>`);
    const grand = grandNum.toFixed(2);

    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.orderId = orderId || '';
    card.innerHTML = `
      <div class="order-card-top">
        <div class="order-left">
          <div class="order-head">
            <div>
              <div class="order-table">${tableLabel}</div>
              <div class="order-muted">Walk-in</div>
              <div class="order-muted">${timeLabel}</div>
            </div>
          </div>
          <div class="order-items">
            ${itemsHtml.join('')}
          </div>
          <div class="order-total-label">Total (incl. tax)</div>
        </div>
        <div class="order-right">
          <div class="order-status order-status--kitchen">In Kitchen</div>
          <div class="order-prices">
            ${pricesHtml.join('')}
            <div class="order-grand">$${grand}</div>
          </div>
        </div>
      </div>
    `;

    orderList.prepend(card);
  }

  // Order History list (delivered/paid orders live here)
  const historyList = document.getElementById('historyList');
  const historyCountEl = document.getElementById('historyCount');

  function updateHistoryCount() {
    if (historyCountEl && historyList)
      historyCountEl.textContent = historyList.querySelectorAll('.order-card[data-order-id]').length;
  }

  // Deliver / Paid buttons (shared by Order tab and Order History tab)
  async function handleOrderAction(e) {
    const deliverBtn = e.target.closest('[data-deliver-order]');
    const paidBtn = e.target.closest('[data-paid-order]');

    if (deliverBtn) {
      const card = deliverBtn.closest('.order-card');
      const statusEl = card?.querySelector('.order-status');
      if (!statusEl) return;

      if (!statusEl.classList.contains('order-status--ready')) {
        statusEl.style.outline = '2px solid rgba(224,115,59,.8)';
        setTimeout(() => statusEl.style.outline = '', 1000);
        return;
      }

      const orderId = card.dataset.orderId;
      if (orderId) {
        try {
          await fetch('../api/update_order_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: parseInt(orderId), status: 'delivered' }),
          });
        } catch { }
      }

      statusEl.classList.remove('order-status--ready', 'order-status--kitchen');
      statusEl.classList.add('order-status--delivered');
      statusEl.textContent = 'Delivered';

      // Transform button to paid
      deliverBtn.removeAttribute('data-deliver-order');
      deliverBtn.setAttribute('data-paid-order', '');
      deliverBtn.style.background = 'var(--green)';
      deliverBtn.textContent = 'Mark as Paid';

      // Move the delivered card into Order History
      if (historyList) {
        historyList.querySelector('.order-card:not([data-order-id])')?.remove();
        historyList.prepend(card);
        updateHistoryCount();
      }

      if (statCompleted)
        statCompleted.textContent = (parseInt(statCompleted.textContent) || 0) + 1;
      updateOrderStats();
    }

    if (paidBtn) {
      const card = paidBtn.closest('.order-card');
      const orderId = card?.dataset.orderId;
      if (orderId) {
        try {
          await fetch('../api/update_order_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: parseInt(orderId), status: 'paid' }),
          });
          const statusEl = card.querySelector('.order-status');
          if (statusEl) statusEl.textContent = 'Paid';
          paidBtn.remove();
          showToast('Order marked as paid');
          updateOrderStats();
          updateHistoryCount();
        } catch {
          showToast('Failed to mark as paid', true);
        }
      }
    }
  }

  orderList?.addEventListener('click', handleOrderAction);
  historyList?.addEventListener('click', handleOrderAction);
  updateHistoryCount();

  // ── New Order Modal (DB-connected) ────────────────────────
  const modal = document.getElementById('newOrderModal');
  const openBtn = document.querySelector('[data-new-order]');

  if (modal && openBtn) {
    const closeEls = modal.querySelectorAll('[data-order-close]');
    const placeBtn = modal.querySelector('[data-order-place]');
    const itemButtons = modal.querySelectorAll('[data-menu-item]');
    const selectedItemsList = document.getElementById('selectedItemsList');
    const selectedItemsTotal = document.getElementById('selectedItemsTotal');
    const EMPTY = '<span style="color:rgba(254,254,255,.45);font-style:italic">No items selected</span>';

    const selectedItems = new Map();
    const formatMoney = n => `$${(+n || 0).toFixed(2)}`;

    function updateSelectedUI() {
      if (!selectedItemsList) return;
      if (!selectedItems.size) {
        selectedItemsList.innerHTML = EMPTY;
        if (selectedItemsTotal) selectedItemsTotal.textContent = formatMoney(0);
        return;
      }
      selectedItemsList.innerHTML = '';
      let total = 0;
      selectedItems.forEach(({ qty, price }, name) => {
        total += qty * price;
        const row = document.createElement('div');
        row.className = 'order-selected-row';
        row.innerHTML = `
          <span>${qty} × ${name}</span>
          <span class="order-selected-item-price">${formatMoney(qty * price)}</span>
          <button class="order-selected-remove" data-remove="${name}" aria-label="Remove">×</button>`;
        selectedItemsList.appendChild(row);
      });
      // Show the tax-inclusive total — must match what the server stores
      const subtotal = Math.round(total * 100) / 100;
      const grand = Math.round(total * 1.10 * 100) / 100;
      const tax = Math.round((grand - subtotal) * 100) / 100;
      if (selectedItemsTotal) {
        selectedItemsTotal.innerHTML =
          `<span style="display:block;font-size:12px;font-weight:600;color:rgba(254,254,255,0.65)">` +
          `Subtotal ${formatMoney(subtotal)} &nbsp;·&nbsp; Tax (10%) ${formatMoney(tax)}</span>` +
          `${formatMoney(grand)}`;
      }
    }

    selectedItemsList?.addEventListener('click', e => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      selectedItems.delete(btn.dataset.remove);
      updateSelectedUI();
    });

    function openModal() {
      modal.removeAttribute('inert');
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.getElementById('orderTableSelect')?.focus();
    }

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('inert', '');
      selectedItems.clear();
      updateSelectedUI();
    }

    openBtn.addEventListener('click', openModal);
    closeEls.forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    itemButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name || 'Item';
        const price = parseFloat(btn.dataset.price) || 0;
        const recipeId = btn.dataset.recipeId ? parseInt(btn.dataset.recipeId) : null;
        const existing = selectedItems.get(name);
        selectedItems.set(name, existing
          ? { qty: existing.qty + 1, price, recipeId }
          : { qty: 1, price, recipeId }
        );
        updateSelectedUI();
      });
    });

    // ★ Place Order → saves to DB
    placeBtn?.addEventListener('click', async () => {
      const select = document.getElementById('orderTableSelect');
      if (!select?.value) {
        if (select) { select.style.outline = '2px solid rgba(224,115,59,.8)'; setTimeout(() => select.style.outline = '', 1200); }
        return;
      }
      if (!selectedItems.size) {
        if (selectedItemsTotal) { selectedItemsTotal.style.color = 'rgba(224,115,59,.9)'; setTimeout(() => selectedItemsTotal.style.color = '', 1200); }
        return;
      }

      // Check if table already has an active order
      const existingOrder = document.querySelector(`.order-card[data-table-id="${select.value}"]`);
      if (existingOrder) {
        if (!confirm("This table already has an active order. Are you sure you want to place another order for this table?")) {
          return;
        }
      }

      placeBtn.disabled = true;
      placeBtn.textContent = 'Placing…';

      const items = [];
      selectedItems.forEach(({ qty, price, recipeId }, name) => {
        items.push({ name, price, quantity: qty, recipe_id: recipeId });
      });

      try {
        const res = await fetch('../api/waiter_place_order.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_id: parseInt(select.value), items }),
        });
        const result = await res.json();

        if (result.success) {
          const itemsSnapshot = new Map(selectedItems);
          closeModal();
          showToast('Order placed successfully!');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast(result.error || 'Failed to place order', true);
        }
      } catch {
        showToast('Network error. Try again.', true);
      } finally {
        placeBtn.disabled = false;
        placeBtn.textContent = 'Place Order';
      }
    });

    updateSelectedUI();
  }

  // ── Profile Modals ────────────────────────────────────────
  const overlays = {
    settings: document.getElementById('settingsOverlay'),
    editProfile: document.getElementById('editProfileOverlay'),
    editPassword: document.getElementById('editPasswordOverlay'),
  };

  function openOverlay(key) { overlays[key]?.classList.add('active'); }
  function closeOverlay(key) { overlays[key]?.classList.remove('active'); }

  document.getElementById('openSettingsBtn')?.addEventListener('click', () => openOverlay('settings'));
  document.getElementById('closeSettings')?.addEventListener('click', () => closeOverlay('settings'));
  document.getElementById('closeEditProfile')?.addEventListener('click', () => closeOverlay('editProfile'));
  document.getElementById('closeEditPassword')?.addEventListener('click', () => closeOverlay('editPassword'));

  document.getElementById('openEditProfile')?.addEventListener('click', () => {
    closeOverlay('settings'); openOverlay('editProfile');
  });
  document.getElementById('openEditPassword')?.addEventListener('click', () => {
    closeOverlay('settings'); openOverlay('editPassword');
  });

  Object.values(overlays).forEach(overlay => {
    overlay?.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const active = Object.entries(overlays).find(([, el]) => el?.classList.contains('active'));
    if (active) closeOverlay(active[0]);
  });

  // Load profile
  async function loadProfile() {
    try {
      const res = await fetch('../api/profile.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.user) return;
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('displayName', data.user.name);
      set('displayEmail', data.user.email);
      set('displayPhone', data.user.phone || '');
      set('displayLocation', data.user.address || '');
      const nameInp = document.getElementById('inputName');
      const emailInp = document.getElementById('inputEmail');
      const phoneInp = document.getElementById('inputPhone');
      const addrInp = document.getElementById('inputAddress');
      if (nameInp) nameInp.value = data.user.name || '';
      if (emailInp) emailInp.value = data.user.email || '';
      if (phoneInp) phoneInp.value = data.user.phone || '';
      if (addrInp) addrInp.value = data.user.address || '';
    } catch { }
  }
  loadProfile();

  // Save profile
  document.getElementById('saveProfile')?.addEventListener('click', async () => {
    const name = document.getElementById('inputName')?.value.trim();
    const email = document.getElementById('inputEmail')?.value.trim();
    const phone = document.getElementById('inputPhone')?.value.trim();
    const address = document.getElementById('inputAddress')?.value.trim();
    if (!name || !email) return;
    try {
      const res = await fetch('../api/profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', name, email, phone, address }),
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('displayName').textContent = name;
        document.getElementById('displayEmail').textContent = email;
        document.getElementById('displayPhone').textContent = phone || '';
        document.getElementById('displayLocation').textContent = address || '';
        closeOverlay('editProfile');
        showToast('Profile updated!');
      } else { showToast(result.error || 'Failed', true); }
    } catch { showToast('Network error.', true); }
  });

  // Change password
  document.getElementById('savePassword')?.addEventListener('click', async () => {
    const cur = document.getElementById('inputCurrentPwd')?.value;
    const newP = document.getElementById('inputNewPwd')?.value;
    const conf = document.getElementById('inputConfirmPwd')?.value;
    if (!cur || !newP || !conf) return;
    if (newP.length < 8) { showToast('Password must be at least 8 characters'); return; }
    if (newP !== conf) { showToast('Passwords do not match'); return; }
    try {
      const res = await fetch('../api/profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', current_password: cur, new_password: newP }),
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('inputCurrentPwd').value = '';
        document.getElementById('inputNewPwd').value = '';
        document.getElementById('inputConfirmPwd').value = '';
        closeOverlay('editPassword');
        showToast('Password changed!');
      } else { showToast(result.error || 'Failed', true); }
    } catch { showToast('Network error.', true); }
  });

  // Password toggles
  document.querySelectorAll('.pw-toggle-cp').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = document.getElementById(btn.dataset.target);
      const icon = btn.querySelector('i');
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      icon.className = inp.type === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
    });
  });

  // ── Ready Deliveries Pool ─────────────────────────────────
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadReadyDeliveries() {
    const list = document.getElementById('readyDeliveriesList');
    if (!list) return;

    try {
      const res = await fetch('../api/get_ready_deliveries.php');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.orders.length === 0) {
        list.innerHTML = `
          <div class="order-card">
            <div class="order-card-top">
              <div class="order-left">
                <div class="order-head">
                  <div>
                    <div class="order-table">No ready deliveries</div>
                    <div class="order-muted">Check back later for new delivery orders.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
        return;
      }

      list.innerHTML = data.orders.map(order => {
        const itemsStr = order.items.map(i => `${i.quantity}x ${escapeHtml(i.name)}`).join(', ');
        return `
          <div class="order-card" data-delivery-id="${order.id}">
            <div class="order-card-top">
              <div class="order-left">
                <div class="order-head">
                  <div class="order-thumb" style="display:flex; align-items:center; justify-content:center; background:#333; color:#c8a96a; font-size:20px;">
                    <i class="fas fa-motorcycle"></i>
                  </div>
                  <div>
                    <div class="order-table">Delivery Order #${order.id}</div>
                    <div class="order-muted"><i class="fas fa-user"></i> ${escapeHtml(order.guest_name || 'Customer')} (${escapeHtml(order.guest_phone || 'N/A')})</div>
                    <div class="order-muted"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.delivery_address || 'No Address Provided')}</div>
                  </div>
                </div>
                <div class="order-items">
                  <div style="color:#ccc; font-size:0.85rem;"><i class="fas fa-utensils"></i> ${itemsStr}</div>
                </div>
              </div>
              <div class="order-right">
                <div class="order-status order-status--ready">Ready for Pickup</div>
                <div style="margin-top:auto;">
                  <button class="order-delivered-btn claim-delivery-btn" data-claim-id="${order.id}" style="background:#c8a96a;">Claim Delivery</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      updateOrderStats();
    } catch (err) {
      console.error(err);
      list.innerHTML = '<div class="order-card"><div class="order-table">Failed to load ready deliveries.</div></div>';
    }
  }

  const readyDeliveriesList = document.getElementById('readyDeliveriesList');
  if (readyDeliveriesList) {
    readyDeliveriesList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.claim-delivery-btn');
      if (!btn) return;

      const orderId = btn.dataset.claimId;
      btn.disabled = true;
      btn.textContent = 'Claiming...';

      // We can use update_order_status.php to assign the waiter
      // Waiter calls it, so it uses $_SESSION['user_id'] as waiter_id.
      // And status stays 'ready', but since we just update it with 'ready', it sets the waiter_id!
      try {
        const res = await fetch('../api/update_order_status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: parseInt(orderId), status: 'ready' }), // stays ready, assigns waiter
        });
        const result = await res.json();
        if (result.success) {
          showToast('Delivery claimed! Check your orders.');
          loadReadyDeliveries();
          // Reload page to show it in My Orders
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast(result.error || 'Failed to claim delivery', true);
        }
      } catch (err) {
        showToast('Network error.', true);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Claim Delivery';
      }
    });
  }

  // Initial call
  if (window.location.pathname.includes('Waiter.php')) {
    loadReadyDeliveries();
  }

}); // end DOMContentLoaded
