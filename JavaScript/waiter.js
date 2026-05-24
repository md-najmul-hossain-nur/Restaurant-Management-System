// waiter.js — Feliciano Waiter Dashboard
// Covers: tab nav, clock out, table take/release (DB),
//         new order modal (DB), deliver order (DB), profile modals

document.addEventListener('DOMContentLoaded', () => {

  // ── Tab Navigation ────────────────────────────────────────
  const tabs     = document.querySelectorAll('.tab[data-section]');
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
  if (clockBtn) {
    const applyState = (out) => {
      document.body.classList.toggle('is-clocked-out', out);
      clockBtn.textContent = out ? 'Clock In' : 'Clock Out';
    };
    applyState(false);
    clockBtn.addEventListener('click', () =>
      applyState(!document.body.classList.contains('is-clocked-out'))
    );
  }

  // ── Toast ─────────────────────────────────────────────────
  function showToast(msg) {
    const toast   = document.getElementById('successToast');
    const msgSpan = toast?.querySelector('.toast-msg');
    if (!toast) return;
    if (msgSpan) msgSpan.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ── Table Take / Release (DB-connected) ──────────────────
  const myTablesGrid    = document.getElementById('myTablesGrid');
  const availTablesGrid = document.getElementById('availTablesGrid');
  const myTableCount    = document.getElementById('myTableCount');
  const availTableCount = document.getElementById('availTableCount');

  function updateTableCounts() {
    if (myTableCount)    myTableCount.textContent    = myTablesGrid?.querySelectorAll('.waiter-table-card').length   || 0;
    if (availTableCount) availTableCount.textContent = availTablesGrid?.querySelectorAll('.waiter-table-card').length || 0;
  }

  async function updateTableStatusDB(tableId, status) {
    try {
      await fetch('../api/update_table_status.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ table_id: tableId, status }),
      });
    } catch {}
  }

  myTablesGrid?.addEventListener('click', e => {
    const releaseBtn = e.target.closest('[data-release]');
    if (!releaseBtn || !availTablesGrid) return;
    const card    = releaseBtn.closest('.waiter-table-card');
    const tableId = releaseBtn.dataset.release;

    releaseBtn.classList.replace('waiter-table-action--release', 'waiter-table-action--take');
    releaseBtn.textContent = 'Take Table';
    releaseBtn.removeAttribute('data-release');
    releaseBtn.setAttribute('data-take', tableId);

    availTablesGrid.appendChild(card);
    updateTableCounts();
    updateTableStatusDB(tableId, 'available');
  });

  availTablesGrid?.addEventListener('click', e => {
    const takeBtn = e.target.closest('[data-take]');
    if (!takeBtn || !myTablesGrid) return;
    const card    = takeBtn.closest('.waiter-table-card');
    const tableId = takeBtn.dataset.take;

    takeBtn.classList.replace('waiter-table-action--take', 'waiter-table-action--release');
    takeBtn.textContent = 'Release Table';
    takeBtn.removeAttribute('data-take');
    takeBtn.setAttribute('data-release', tableId);

    myTablesGrid.appendChild(card);
    updateTableCounts();
    updateTableStatusDB(tableId, 'occupied');
  });

  updateTableCounts();

  // ── Order Stats ───────────────────────────────────────────
  const orderList       = document.querySelector('#order .order-list') ||
                          document.querySelector('#order');
  const statPending     = document.getElementById('statPending');
  const statProgress    = document.getElementById('statProgress');
  const statCompleted   = document.getElementById('statCompleted');
  const orderCountEl    = document.getElementById('orderCount');

  function updateOrderStats() {
    if (!orderList) return;
    const cards    = orderList.querySelectorAll('.order-card');
    const ready    = orderList.querySelectorAll('.order-status--ready').length;
    const kitchen  = orderList.querySelectorAll('.order-status--kitchen').length;
    if (orderCountEl) orderCountEl.textContent  = cards.length;
    if (statPending)  statPending.textContent   = ready;
    if (statProgress) statProgress.textContent  = kitchen;
  }
  updateOrderStats();

  // Deliver button
  orderList?.addEventListener('click', async e => {
    const deliverBtn = e.target.closest('[data-deliver-order]');
    if (!deliverBtn) return;
    const card     = deliverBtn.closest('.order-card');
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
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ order_id: parseInt(orderId), status: 'served' }),
        });
      } catch {}
    }

    statusEl.classList.remove('order-status--ready', 'order-status--kitchen');
    statusEl.classList.add('order-status--delivered');
    statusEl.textContent = 'Delivered';
    deliverBtn.remove();

    if (statCompleted)
      statCompleted.textContent = (parseInt(statCompleted.textContent) || 0) + 1;
    updateOrderStats();
  });

  // ── New Order Modal (DB-connected) ────────────────────────
  const modal   = document.getElementById('newOrderModal');
  const openBtn = document.querySelector('[data-new-order]');

  if (modal && openBtn) {
    const closeEls           = modal.querySelectorAll('[data-order-close]');
    const placeBtn           = modal.querySelector('[data-order-place]');
    const itemButtons        = modal.querySelectorAll('[data-menu-item]');
    const selectedItemsList  = document.getElementById('selectedItemsList');
    const selectedItemsTotal = document.getElementById('selectedItemsTotal');
    const EMPTY              = '<span style="color:rgba(254,254,255,.45);font-style:italic">No items selected</span>';

    const selectedItems = new Map();
    const formatMoney   = n => `$${(+n || 0).toFixed(2)}`;

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
      if (selectedItemsTotal) selectedItemsTotal.textContent = formatMoney(total);
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
        const name  = btn.dataset.name  || 'Item';
        const price = parseFloat(btn.dataset.price) || 0;
        const existing = selectedItems.get(name);
        selectedItems.set(name, existing
          ? { qty: existing.qty + 1, price }
          : { qty: 1, price }
        );
        updateSelectedUI();
      });
    });

    // ★ Place Order → saves to DB
    placeBtn?.addEventListener('click', async () => {
      const select  = document.getElementById('orderTableSelect');
      if (!select?.value) {
        if (select) { select.style.outline = '2px solid rgba(224,115,59,.8)'; setTimeout(() => select.style.outline = '', 1200); }
        return;
      }
      if (!selectedItems.size) {
        if (selectedItemsTotal) { selectedItemsTotal.style.color = 'rgba(224,115,59,.9)'; setTimeout(() => selectedItemsTotal.style.color = '', 1200); }
        return;
      }

      placeBtn.disabled    = true;
      placeBtn.textContent = 'Placing…';

      const items = [];
      selectedItems.forEach(({ qty, price }, name) => {
        items.push({ name, price, quantity: qty });
      });

      try {
        const res    = await fetch('../api/waiter_place_order.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ table_id: parseInt(select.value), items }),
        });
        const result = await res.json();

        if (result.success) {
          closeModal();
          showToast('Order placed successfully!');
          if (statPending)
            statPending.textContent = (parseInt(statPending.textContent) || 0) + 1;
        } else {
          showToast(result.error || 'Failed to place order');
        }
      } catch {
        showToast('Network error. Try again.');
      } finally {
        placeBtn.disabled    = false;
        placeBtn.textContent = 'Place Order';
      }
    });

    updateSelectedUI();
  }

  // ── Profile Modals ────────────────────────────────────────
  const overlays = {
    settings:     document.getElementById('settingsOverlay'),
    editProfile:  document.getElementById('editProfileOverlay'),
    editPassword: document.getElementById('editPasswordOverlay'),
  };

  function openOverlay(key)  { overlays[key]?.classList.add('active');    }
  function closeOverlay(key) { overlays[key]?.classList.remove('active'); }

  document.getElementById('openSettingsBtn')?.addEventListener('click',  () => openOverlay('settings'));
  document.getElementById('closeSettings')?.addEventListener('click',    () => closeOverlay('settings'));
  document.getElementById('closeEditProfile')?.addEventListener('click', () => closeOverlay('editProfile'));
  document.getElementById('closeEditPassword')?.addEventListener('click',() => closeOverlay('editPassword'));

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
      const res  = await fetch('../api/profile.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.user) return;
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('displayName',  data.user.name);
      set('displayEmail', data.user.email);
      const nameInp  = document.getElementById('inputName');
      const emailInp = document.getElementById('inputEmail');
      if (nameInp)  nameInp.value  = data.user.name;
      if (emailInp) emailInp.value = data.user.email;
    } catch {}
  }
  loadProfile();

  // Save profile
  document.getElementById('saveProfile')?.addEventListener('click', async () => {
    const name  = document.getElementById('inputName')?.value.trim();
    const email = document.getElementById('inputEmail')?.value.trim();
    if (!name || !email) return;
    try {
      const res    = await fetch('../api/profile.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'update_profile', name, email }),
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('displayName').textContent  = name;
        document.getElementById('displayEmail').textContent = email;
        closeOverlay('editProfile');
        showToast('Profile updated!');
      } else { showToast(result.error || 'Failed'); }
    } catch { showToast('Network error.'); }
  });

  // Change password
  document.getElementById('savePassword')?.addEventListener('click', async () => {
    const cur  = document.getElementById('inputCurrentPwd')?.value;
    const newP = document.getElementById('inputNewPwd')?.value;
    const conf = document.getElementById('inputConfirmPwd')?.value;
    if (!cur || !newP || !conf) return;
    if (newP.length < 8) { showToast('Password must be at least 8 characters'); return; }
    if (newP !== conf)   { showToast('Passwords do not match'); return; }
    try {
      const res    = await fetch('../api/profile.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'change_password', current_password: cur, new_password: newP }),
      });
      const result = await res.json();
      if (result.success) {
        document.getElementById('inputCurrentPwd').value = '';
        document.getElementById('inputNewPwd').value     = '';
        document.getElementById('inputConfirmPwd').value = '';
        closeOverlay('editPassword');
        showToast('Password changed!');
      } else { showToast(result.error || 'Failed'); }
    } catch { showToast('Network error.'); }
  });

  // Password toggles
  document.querySelectorAll('.pw-toggle-cp').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp  = document.getElementById(btn.dataset.target);
      const icon = btn.querySelector('i');
      if (!inp) return;
      inp.type       = inp.type === 'password' ? 'text' : 'password';
      icon.className = inp.type === 'password' ? 'far fa-eye' : 'far fa-eye-slash';
    });
  });

}); // end DOMContentLoaded