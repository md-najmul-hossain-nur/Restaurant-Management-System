// admin.js — Feliciano Admin Dashboard
// Covers: tab nav, clock out, modals, employee form,
//         table status/add/edit, menu approve/edit, customer approve

document.addEventListener('DOMContentLoaded', () => {

  // ── Tab Navigation ────────────────────────────────────────
  const tabs     = document.querySelectorAll('.tab[data-section]');
  const sections = document.querySelectorAll('.section-content');

  function switchTab(sectionId) {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    const tab = document.querySelector(`.tab[data-section="${sectionId}"]`);
    const sec = document.getElementById(sectionId);
    if (tab) tab.classList.add('active');
    if (sec) sec.classList.add('active');
  }

  // Expose globally for onclick= in HTML quick actions
  window.switchTab = switchTab;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (document.body.classList.contains('is-clocked-out')) return;
      switchTab(tab.dataset.section);
    });
  });

  // ── Clock Out ─────────────────────────────────────────────
  const clockBtn = document.querySelector('.panel.hero [data-clock-out]');
  if (clockBtn) {
    const main = document.querySelector('.main-content');
    let banner = document.getElementById('clockoutBanner');
    if (!banner && main) {
      banner = document.createElement('div');
      banner.id        = 'clockoutBanner';
      banner.className = 'clockout-banner';
      banner.textContent = 'You are clocked out';
      main.prepend(banner);
    }
    const applyState = (isClockedOut) => {
      document.body.classList.toggle('is-clocked-out', isClockedOut);
      clockBtn.textContent = isClockedOut ? 'Clock In' : 'Clock Out';
    };
    applyState(false);
    clockBtn.addEventListener('click', () =>
      applyState(!document.body.classList.contains('is-clocked-out'))
    );
  }

  // ── Generic Modal Helpers ─────────────────────────────────
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); }
  }
  window.openModal = openModal;

  // Close buttons (.modal-close and .modal-close-btn)
  document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      if (modal) modal.classList.remove('active');
    });
  });

  // Click outside modal content → close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  // ── Add Employee Modal ────────────────────────────────────
  const openAddEmpBtn  = document.getElementById('openAddEmployee');
  const employeeForm   = document.getElementById('employeeForm');
  const roleSelect     = document.getElementById('employeeRole');
  const certInput      = document.getElementById('certificate');
  const certGroup      = certInput ? certInput.closest('.form-group') : null;

  if (openAddEmpBtn) openAddEmpBtn.addEventListener('click', () => openModal('addEmployeeModal'));

  // Show/hide certificate based on role
  if (roleSelect && certGroup) {
    const toggle = () => {
      certGroup.style.display = roleSelect.value === 'chief' ? 'block' : 'none';
      if (certInput) certInput.required = roleSelect.value === 'chief';
    };
    toggle();
    roleSelect.addEventListener('change', toggle);
  }

  if (employeeForm) {
    employeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = employeeForm.querySelector('[type="submit"]');
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Adding…';

      try {
        const formData = new FormData(employeeForm);
        const res      = await fetch('../api/add_employee.php', {
          method: 'POST',
          body:   formData,   // multipart for file upload
        });
        const result = await res.json();

        if (result.success) {
          // Add card to the employees grid
          const grid = document.querySelector('.employees-grid');
          if (grid) {
            const role   = formData.get('role');
            const card   = document.createElement('div');
            card.className = 'employee-card';
            card.innerHTML = `
              <div class="employee-info">
                <h4>${formData.get('fullName')}</h4>
                <p>${formData.get('email')}</p>
                <div class="status-badges">
                  <span class="badge clocked-out"><i class="fas fa-clock"></i> Clocked Out</span>
                  <span class="badge approved"><i class="fas fa-check"></i> Approved</span>
                </div>
              </div>
              <span class="role-badge ${role}">${role === 'chief' ? 'Chef' : 'Waiter'}</span>`;
            grid.appendChild(card);
          }
          employeeForm.reset();
          closeModal('addEmployeeModal');
          showAdminToast('Employee added successfully!');
        } else {
          showAdminToast(result.error || 'Failed to add employee', true);
        }
      } catch (err) {
        console.error(err);
        showAdminToast('Network error. Try again.', true);
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Add Employee';
      }
    });
  }

  // ── Add Table Modal ───────────────────────────────────────
  const openAddTableBtn = document.getElementById('openAddTable');
  const tableForm       = document.getElementById('tableForm');

  if (openAddTableBtn) openAddTableBtn.addEventListener('click', () => openModal('addTableModal'));

  if (tableForm) {
    tableForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = tableForm.querySelector('[type="submit"]');
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Adding…';

      try {
        const formData = new FormData(tableForm);
        const res      = await fetch('../api/add_table.php', { method: 'POST', body: formData });
        const result   = await res.json();

        if (result.success) {
          tableForm.reset();
          closeModal('addTableModal');
          showAdminToast('Table added! Refresh to see it in the grid.');
        } else {
          showAdminToast(result.error || 'Failed to add table', true);
        }
      } catch (err) {
        showAdminToast('Network error.', true);
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Add Table';
      }
    });
  }

  // ── Table Status Dropdown ─────────────────────────────────
  const tablesGrid = document.getElementById('tablesGrid');
  if (tablesGrid) {
    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.dataset.filter;
        tablesGrid.querySelectorAll('.table-card').forEach(card => {
          card.style.display =
            (filter === 'all' || card.dataset.status === filter) ? '' : 'none';
        });
      });
    });

    // Status dropdown change → save to DB
    tablesGrid.addEventListener('change', async (e) => {
      const select = e.target.closest('.status-select');
      if (!select) return;

      const tableId = select.dataset.tableId;
      const status  = select.value;
      const card    = select.closest('.table-card');

      try {
        const res    = await fetch('../api/update_table_status.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ table_id: tableId, status }),
        });
        const result = await res.json();
        if (result.success) {
          // Update card data-status for filter
          if (card) card.dataset.status = status;
          updateTableStats();
          showAdminToast('Table status updated');
        } else {
          showAdminToast(result.error || 'Update failed', true);
        }
      } catch (err) {
        showAdminToast('Network error.', true);
      }
    });

    // Edit table button → open edit modal pre-filled
    tablesGrid.addEventListener('click', e => {
      const editBtn = e.target.closest('.table-edit-btn');
      if (!editBtn) return;
      const card = editBtn.closest('.table-card');
      if (!card) return;

      const tableId = card.dataset.tableId;
      const pos     = card.dataset.position || '';

      const numEl  = document.getElementById('editTableNumber');
      const posEl  = document.getElementById('editTablePosition');
      const capEl  = document.getElementById('editTableCapacity');
      const delBtn = document.getElementById('deleteTableBtn');

      if (numEl) numEl.value = tableId;
      if (posEl) posEl.value = pos;
      if (capEl) {
        // read capacity from the card's meta text if available
        const metaEl = card.querySelector('.table-meta');
        capEl.value  = metaEl ? parseInt(metaEl.textContent) || '' : '';
      }

      if (delBtn) {
        delBtn.onclick = async () => {
          if (!confirm('Delete this table? This cannot be undone.')) return;
          try {
            const res    = await fetch('../api/update_table_status.php', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ table_id: tableId, status: 'available', _delete: true }),
            });
            card.remove();
            closeModal('editTableModal');
            updateTableStats();
            showAdminToast('Table removed from view (delete API needed)');
          } catch {}
        };
      }

      openModal('editTableModal');
    });
  }

  function updateTableStats() {
    const cards = document.querySelectorAll('.table-card');
    let available = 0, reserved = 0, occupied = 0;
    cards.forEach(c => {
      if (c.dataset.status === 'available') available++;
      else if (c.dataset.status === 'reserved') reserved++;
      else if (c.dataset.status === 'occupied') occupied++;
    });
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statTotal',     cards.length);
    set('statAvailable', available);
    set('statReserved',  reserved);
    set('statOccupied',  occupied);
  }

  // ── Menu Item Approval ────────────────────────────────────
  // Approve/reject buttons on pending menu cards
  document.querySelectorAll('.customer-action-btn[data-action]').forEach(btn => {
    // This selector targets BOTH customer and menu approval buttons
    // We only handle menu ones here — check parent context
    const card = btn.closest('[data-menu-id]');
    if (!card) return;

    btn.addEventListener('click', async () => {
      const menuId = card.dataset.menuId;
      const action = btn.dataset.action; // 'approve' or 'reject'
      try {
        const res    = await fetch('../api/approve_menu_item.php', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ recipe_id: menuId, action }),
        });
        const result = await res.json();
        if (result.success) {
          card.remove();
          updateMenuCount();
          showAdminToast(`Item ${action}d`);
        } else {
          showAdminToast(result.error || 'Failed', true);
        }
      } catch {
        showAdminToast('Network error.', true);
      }
    });
  });

  function updateMenuCount() {
    const pending = document.querySelectorAll('#pendingMenuItems [data-menu-id]').length;
    const el      = document.getElementById('pendingMenuCount');
    if (el) el.textContent = pending;
  }

  const reservationRequests = document.getElementById('reservationRequests');

  function renderReservationRequests(reservations) {
    if (!reservationRequests) return;

    const pending = (reservations || []).filter(r => r.status === 'pending');
    if (!pending.length) {
      reservationRequests.innerHTML = '<div class="reservation-request"><p>No pending reservation requests.</p></div>';
      return;
    }

    reservationRequests.innerHTML = pending.map(r => `
      <div class="reservation-request" data-reservation-id="${r.id}">
        <div>
          <h4>Table ${r.table_number} - ${r.customer_name || 'Customer'}</h4>
          <p>${r.reserved_date} at ${r.reserved_time} - ${r.guest_count} guests</p>
          <p>${r.customer_email || ''}</p>
        </div>
        <div class="reservation-request-actions">
          <button type="button" class="customer-action-btn approve" data-reservation-action="approved">
            <i class="fas fa-check"></i> Approve
          </button>
          <button type="button" class="customer-action-btn reject" data-reservation-action="rejected">
            <i class="fas fa-times"></i> Reject
          </button>
        </div>
      </div>
    `).join('');
  }

  async function loadReservationRequests() {
    if (!reservationRequests) return;

    try {
      const res = await fetch('../api/get_reservations_admin.php');
      const data = await res.json();
      renderReservationRequests(Array.isArray(data) ? data : []);
    } catch {
      reservationRequests.innerHTML = '<div class="reservation-request"><p>Could not load reservation requests.</p></div>';
    }
  }

  if (reservationRequests) {
    reservationRequests.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-reservation-action]');
      if (!btn) return;

      const card = btn.closest('[data-reservation-id]');
      const reservationId = card?.dataset.reservationId;
      const status = btn.dataset.reservationAction;
      if (!reservationId) return;

      try {
        const res = await fetch('../api/update_reservation_status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_id: reservationId, status }),
        });
        const result = await res.json();

        if (result.success) {
          card.remove();
          showAdminToast(`Reservation ${status === 'approved' ? 'approved' : 'rejected'}`);
          loadReservationRequests();
        } else {
          showAdminToast(result.error || 'Failed to update reservation', true);
        }
      } catch {
        showAdminToast('Network error.', true);
      }
    });

    loadReservationRequests();
  }

  // ── Edit Menu Modal ───────────────────────────────────────
  const editMenuModal = document.getElementById('editMenuModal');
  const editMenuForm  = document.getElementById('editMenuForm');
  let currentMenuCard = null;

  document.querySelectorAll('.menu-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.menu-card');
      if (!card) return;
      currentMenuCard = card;

      const nameEl  = card.querySelector('.menu-name');
      const priceEl = card.querySelector('.menu-price');
      const descEl  = card.querySelector('.menu-desc');
      const tagEl   = card.querySelector('.menu-tag');

      if (nameEl)  document.getElementById('editMenuName').value  = nameEl.textContent;
      if (priceEl) document.getElementById('editMenuPrice').value = priceEl.textContent;
      if (descEl)  document.getElementById('editMenuDesc').value  = descEl.textContent;
      if (tagEl)   document.getElementById('editMenuTag').value   = tagEl.textContent;
      document.getElementById('editMenuImage').value = '';

      openModal('editMenuModal');
    });
  });

  if (editMenuForm) {
    editMenuForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = editMenuForm.querySelector('[type="submit"]');
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Saving…';

      try {
        const formData = new FormData(editMenuForm);
        // Attach the recipe id from the card
        if (currentMenuCard) formData.append('recipe_id', currentMenuCard.dataset.menuId || '');

        const res    = await fetch('../api/update_menu_item.php', { method: 'POST', body: formData });
        const result = await res.json();

        if (result.success) {
          // Update DOM card
          if (currentMenuCard) {
            const n = currentMenuCard.querySelector('.menu-name');
            const p = currentMenuCard.querySelector('.menu-price');
            const d = currentMenuCard.querySelector('.menu-desc');
            const t = currentMenuCard.querySelector('.menu-tag');
            if (n) n.textContent = formData.get('editMenuName');
            if (p) p.textContent = formData.get('editMenuPrice');
            if (d) d.textContent = formData.get('editMenuDesc');
            if (t) t.textContent = formData.get('editMenuTag');
          }
          closeModal('editMenuModal');
          showAdminToast('Menu item updated!');
        } else {
          showAdminToast(result.error || 'Update failed', true);
        }
      } catch {
        showAdminToast('Network error.', true);
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Save Changes';
        currentMenuCard = null;
      }
    });
  }

  // ── Customer Approval ─────────────────────────────────────
  const pendingCustomers = document.getElementById('pendingCustomers');
  const approvedCustomers = document.getElementById('approvedCustomers');

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  }

  function renderCustomerLists(data) {
    if (!pendingCustomers || !approvedCustomers) return;

    const pending = Array.isArray(data?.pending) ? data.pending : [];
    const approved = Array.isArray(data?.approved) ? data.approved : [];

    pendingCustomers.innerHTML = pending.length ? pending.map(customer => `
      <div class="customer-request" data-customer-id="${escapeHtml(customer.id)}">
        <div class="customer-request-info">
          <h4>${escapeHtml(customer.name)}</h4>
          <p>${escapeHtml(customer.email)}</p>
          <small>Member since ${escapeHtml(formatDate(customer.created_at))}</small>
        </div>
        <div class="customer-request-actions">
          <button type="button" class="customer-action-btn approve" data-customer-action="approved">
            <i class="fas fa-check"></i> Approve
          </button>
          <button type="button" class="customer-action-btn reject" data-customer-action="rejected">
            <i class="fas fa-times"></i> Reject
          </button>
        </div>
      </div>
    `).join('') : '<div class="customer-request empty-state"><p>No pending customer approvals.</p></div>';

    approvedCustomers.innerHTML = approved.length ? approved.map(customer => `
      <div class="customer-request approved" data-customer-id="${escapeHtml(customer.id)}">
        <div class="customer-request-info">
          <h4>${escapeHtml(customer.name)}</h4>
          <p>${escapeHtml(customer.email)}</p>
          <small>Approved on ${escapeHtml(formatDate(customer.approval_decided_at || customer.created_at))}</small>
        </div>
        <div class="customer-request-status">
          <span class="status-badge approved-badge"><i class="fas fa-check-circle"></i> Approved</span>
        </div>
      </div>
    `).join('') : '<div class="customer-request approved empty-state"><p>No approved customers yet.</p></div>';

    const pendingCount = document.getElementById('pendingCount');
    const approvedCount = document.getElementById('approvedCount');
    if (pendingCount) pendingCount.textContent = String(pending.length);
    if (approvedCount) approvedCount.textContent = String(approved.length);
  }

  async function loadCustomers() {
    if (!pendingCustomers || !approvedCustomers) return;

    try {
      const res = await fetch('../api/get_customers.php');
      const data = await res.json();
      renderCustomerLists(data);
    } catch {
      pendingCustomers.innerHTML = '<div class="customer-request empty-state"><p>Could not load pending customers.</p></div>';
      approvedCustomers.innerHTML = '<div class="customer-request approved empty-state"><p>Could not load approved customers.</p></div>';
    }
  }

  if (pendingCustomers) {
    const customerApprovalShell = document.querySelector('.customer-approval');
    if (customerApprovalShell) {
      customerApprovalShell.addEventListener('click', async (e) => {
        const btn = e.target.closest('.customer-action-btn[data-customer-action]');
        if (!btn) return;

        const card = btn.closest('[data-customer-id]');
        if (!card) return;

        const customerId = card.dataset.customerId;
        const status = btn.dataset.customerAction;

        try {
          const res = await fetch('../api/update_customer_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: customerId, status }),
          });
          const result = await res.json();

          if (result.success) {
            await loadCustomers();
            showAdminToast(`Customer ${status}`);
          } else {
            showAdminToast(result.error || 'Failed to update customer', true);
          }
        } catch {
          showAdminToast('Network error.', true);
        }
      });
    }

    loadCustomers();
  }

  // ── Financial Reports ───────────────────────────────────
  const reportStart = document.getElementById('reportStart');
  const reportEnd = document.getElementById('reportEnd');
  const reportTotalRevenue = document.getElementById('reportTotalRevenue');
  const reportTotalOrders = document.getElementById('reportTotalOrders');
  const reportAvgOrderValue = document.getElementById('reportAvgOrderValue');
  const downloadReportBtn = document.getElementById('downloadReportBtn');

  function getReportRange() {
    const start = reportStart?.value || '';
    const end = reportEnd?.value || '';
    return { start, end };
  }

  function setReportSummary(summary) {
    const revenue = Number(summary?.total_revenue || 0);
    const orders = Number(summary?.total_orders || 0);
    const avg = Number(summary?.avg_order_value || 0);

    if (reportTotalRevenue) reportTotalRevenue.textContent = `$${revenue.toFixed(2)}`;
    if (reportTotalOrders) reportTotalOrders.textContent = String(orders);
    if (reportAvgOrderValue) reportAvgOrderValue.textContent = `$${avg.toFixed(2)}`;
  }

  async function loadFinancialReport() {
    if (!reportStart || !reportEnd) return;

    try {
      const { start, end } = getReportRange();
      const url = `../api/get_financial_report.php?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      const res = await fetch(url);
      const data = await res.json();
      setReportSummary(data.summary);
    } catch (err) {
      console.error(err);
      setReportSummary({ total_revenue: 0, total_orders: 0, avg_order_value: 0 });
      showAdminToast('Could not load financial report', true);
    }
  }

  if (reportStart) reportStart.addEventListener('change', loadFinancialReport);
  if (reportEnd) reportEnd.addEventListener('change', loadFinancialReport);
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', () => {
      const { start, end } = getReportRange();
      const url = `../api/get_financial_report.php?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&format=csv`;
      window.location.href = url;
    });
  }

  loadFinancialReport();

  // ── Toast ─────────────────────────────────────────────────
  function showAdminToast(msg, isError = false) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:9999;
        padding:12px 20px;border-radius:10px;font-size:14px;
        color:#fff;opacity:0;transition:opacity .3s;pointer-events:none;`;
      document.body.appendChild(toast);
    }
    toast.textContent       = msg;
    toast.style.background  = isError ? '#c0392b' : '#27ae60';
    toast.style.opacity     = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.style.opacity = '0', 2800);
  }

  // ── Order cards status (chief page uses admin.js too) ─────
  document.querySelectorAll('.order-card').forEach(card => {
    const statusEl  = card.querySelector('.status-badge');
    const actionBtn = card.querySelector('[data-mark-ready]');
    if (!actionBtn || !statusEl) return;

    const status = (statusEl.textContent || '').trim().toLowerCase();
    if (status === 'ready' || status === 'served') {
      actionBtn.hidden   = true;
      actionBtn.disabled = true;
      return;
    }

    actionBtn.addEventListener('click', async () => {
      const orderId = card.dataset.orderId;
      if (orderId) {
        try {
          await fetch('../api/update_order_status.php', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ order_id: orderId, status: 'ready' }),
          });
        } catch {}
      }
      statusEl.textContent = 'Ready';
      actionBtn.textContent = '✓ Ready';
      actionBtn.disabled    = true;
      setTimeout(() => { actionBtn.hidden = true; }, 400);
    });
  });

  updateTableStats();

}); // end DOMContentLoaded
