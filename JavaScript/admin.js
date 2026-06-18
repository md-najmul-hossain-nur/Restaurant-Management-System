// admin.js — Feliciano Admin Dashboard
// Covers: tab nav, clock out, modals, employee form,
//         table status/add/edit, menu approve/edit, customer approve

document.addEventListener('DOMContentLoaded', () => {
  let employeeTimerId;
  function updateEmployeeTimers() { }

  // ── Tab Navigation ────────────────────────────────────────
  const tabs = document.querySelectorAll('.tab[data-section]');
  const sections = document.querySelectorAll('.section-content');

  function switchTab(sectionId) {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    const tab = document.querySelector(`.tab[data-section="${sectionId}"]`);
    const sec = document.getElementById(sectionId);
    if (tab) tab.classList.add('active');
    if (sec) sec.classList.add('active');

    // Update Global Hero
    const globalTitle = document.getElementById('globalPageTitle');
    const globalSubtitle = document.getElementById('globalPageSubtitle');
    if (globalTitle) {
      globalTitle.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    }
    if (globalSubtitle) {
      const descriptions = {
        overview: 'Restaurant performance at a glance',
        employees: 'Manage your staff, roles, and status',
        customer: 'Review and approve customer account requests',
        chat: 'Communicate with staff and customer support',
        tables: 'Manage restaurant floor plan and table status',
        menu: 'Approve and edit dish recipes and menu items',
        reports: 'Detailed financial and performance metrics'
      };
      globalSubtitle.textContent = descriptions[sectionId] || '';
    }

    if (sectionId === 'chat') {
      loadChatConversations();
    }
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
      banner.id = 'clockoutBanner';
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
  const openAddEmpBtn = document.getElementById('openAddEmployee');
  const employeeForm = document.getElementById('employeeForm');
  const roleSelect = document.getElementById('employeeRole');
  const certInput = document.getElementById('certificate');
  const certGroup = certInput ? certInput.closest('.form-group') : null;

  if (openAddEmpBtn) openAddEmpBtn.addEventListener('click', () => openModal('addEmployeeModal'));

  // Keep the certificate field visible; only make it mandatory for Chef.
  if (roleSelect && certGroup) {
    const toggle = () => {
      const isChief = String(roleSelect.value || '').toLowerCase() === 'chief';
      certGroup.style.display = 'flex';
      if (certInput) {
        certInput.disabled = false;
        certInput.required = isChief;
      }
    };
    toggle();
    roleSelect.addEventListener('change', toggle);
    roleSelect.addEventListener('input', toggle);
  }

  if (employeeForm) {
    employeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = String(employeeForm.elements.fullName?.value || '').trim();
      const email = String(employeeForm.elements.email?.value || '').trim();
      const password = String(employeeForm.elements.password?.value || '');
      const role = String(employeeForm.elements.role?.value || '').trim();
      const certificateFile = certInput?.files?.[0] || null;

      const submitBtn = employeeForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding…';

      try {
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', role);
        if (certificateFile) {
          formData.append('certificate', certificateFile, certificateFile.name);
        }

        const res = await fetch('../api/add_employee.php', {
          method: 'POST',
          body: formData,   // multipart for file upload
        });
        const result = await res.json();

        if (result.success) {
          // Add card to the employees grid
          const grid = document.querySelector('.employees-grid');
          if (grid) {
            const role = String(formData.get('role') || '').toLowerCase();
            const name = String(formData.get('fullName') || '').trim() || 'New Employee';
            const email = String(formData.get('email') || '').trim() || '—';
            const card = document.createElement('div');
            card.className = 'employee-card';
            card.dataset.added = new Date().toISOString();
            card.dataset.clocked = '0';
            card.innerHTML = `
              <div class="employee-info">
                <h4>${name}</h4>
                <p>${email}</p>
                <div class="status-badges">
                  <span class="badge clocked-out"><i class="fas fa-clock"></i> Clocked Out</span>
                  <span class="badge approved"><i class="fas fa-check"></i> Approved</span>
                </div>
                <div class="employee-time"><span class="time-label"></span> <span class="time-value"></span></div>
              </div>
              <div class="employee-actions">
                <span class="role-badge ${role}">${role === 'chief' ? 'Chef' : 'Waiter'}</span>
              </div>`;

            const empty = grid.querySelector('.employee-empty');
            if (empty) empty.remove();
            grid.appendChild(card);
          }
          if (!employeeTimerId) {
            updateEmployeeTimers();
            employeeTimerId = setInterval(updateEmployeeTimers, 1000);
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
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Employee';
      }
    });
  }

  // ── Employee Timers removed ───────────────────────────────

  // ── Add Table Modal ───────────────────────────────────────
  const openAddTableBtn = document.getElementById('openAddTable');
  const tableForm = document.getElementById('tableForm');

  if (openAddTableBtn) openAddTableBtn.addEventListener('click', () => openModal('addTableModal'));

  if (tableForm) {
    tableForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = tableForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Adding…';

      try {
        const formData = new FormData(tableForm);
        const res = await fetch('../api/add_table.php', { method: 'POST', body: formData });
        const result = await res.json();

        if (result.success) {
          const grid = document.getElementById('tablesGrid');
          if (grid) {
            const tableId = result.table_id || '';
            const tableNumber = result.table_number || formData.get('tableNumber');
            const capacity = result.capacity || formData.get('tableCapacity');
            const position = String(result.position || formData.get('tablePosition') || '').toLowerCase();
            const status = result.status || 'available';

            const posLabel = position ? capitalize(position) : 'Unknown';
            const imgPath = result.image_path ? normalizeImagePath(result.image_path) : '../Images/Table/4_people table.jpg';

            const card = document.createElement('div');
            card.className = 'table-card';
            card.dataset.tableId = String(tableId);
            card.dataset.tableNumber = String(tableNumber || '');
            card.dataset.capacity = String(capacity || '');
            card.dataset.status = String(status);
            card.dataset.position = String(position);
            card.dataset.guest = 'Customer';
            card.dataset.time = '';
            card.dataset.guests = '';

            card.innerHTML = `
              <div class="table-header-row">
                <span class="position-badge">${posLabel}</span>
                <div class="table-actions">
                  <button type="button" class="table-edit-btn" aria-label="Edit table" title="Edit">
                    <i class="fas fa-pencil"></i>
                  </button>
                </div>
              </div>
              <div class="table-number">
                <img class="table-icon" src="${imgPath}" alt="Table" />
              </div>
              <h4>Table ${tableNumber}</h4>
              <div class="table-meta">Capacity: ${capacity}</div>
              <div class="table-status-display">
                <span class="status-badge ${status}">
                  ${status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            `;

            const empty = grid.querySelector('.table-card:not([data-table-id])');
            if (empty) empty.remove();

            const cards = Array.from(grid.querySelectorAll('.table-card[data-table-number]'));
            const num = parseInt(tableNumber, 10);
            const insertBefore = cards.find(c => {
              const n = parseInt(c.dataset.tableNumber || '0', 10);
              return Number.isFinite(num) && Number.isFinite(n) && n > num;
            });
            if (insertBefore) {
              grid.insertBefore(card, insertBefore);
            } else {
              grid.appendChild(card);
            }

            updateTableStats();
          }

          tableForm.reset();
          closeModal('addTableModal');
          showAdminToast('Table added!');
        } else {
          showAdminToast(result.error || 'Failed to add table', true);
        }
      } catch (err) {
        showAdminToast('Network error.', true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Add Table';
      }
    });
  }

  // ── Table Status Dropdown ─────────────────────────────────
  const tablesGrid = document.getElementById('tablesGrid');
  const editTableForm = document.getElementById('editTableForm');
  let currentTableCard = null;
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
      const status = select.value;
      const card = select.closest('.table-card');

      try {
        const res = await fetch('../api/update_table_status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_id: tableId, status }),
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
      currentTableCard = card;

      const tableId = card.dataset.tableId;
      const pos = card.dataset.position || '';
      const cap = card.dataset.capacity || '';
      const tableNumber = card.dataset.tableNumber || tableId;

      const numEl = document.getElementById('editTableNumber');
      const posEl = document.getElementById('editTablePosition');
      const capEl = document.getElementById('editTableCapacity');
      const delBtn = document.getElementById('deleteTableBtn');

      if (numEl) numEl.value = tableNumber;
      if (posEl) posEl.value = pos;
      if (capEl) capEl.value = cap;

      if (delBtn) {
        delBtn.onclick = async () => {
          if (!confirm('Delete this table? This cannot be undone.')) return;
          try {
            const res = await fetch('../api/update_table_status.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ table_id: tableId, _delete: true }),
            });
            const result = await res.json();
            if (result.success) {
              card.remove();
              closeModal('editTableModal');
              updateTableStats();
              showAdminToast('Table deleted');
            } else {
              showAdminToast(result.error || 'Delete failed', true);
            }
          } catch {
            showAdminToast('Network error.', true);
          }
        };
      }

      openModal('editTableModal');
    });
  }

  if (editTableForm) {
    editTableForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentTableCard) return;

      const submitBtn = editTableForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';

      try {
        const formData = new FormData(editTableForm);
        formData.append('tableId', currentTableCard.dataset.tableId || '');

        const res = await fetch('../api/update_table.php', {
          method: 'POST',
          body: formData,
        });
        const result = await res.json();

        if (result.success) {
          const newCapacity = formData.get('editTableCapacity');
          const newPosition = formData.get('editTablePosition');

          currentTableCard.dataset.capacity = String(newCapacity || '');
          currentTableCard.dataset.position = String(newPosition || '');

          const positionBadge = currentTableCard.querySelector('.position-badge');
          if (positionBadge) positionBadge.textContent = newPosition ? capitalize(newPosition) : 'Unknown';

          const metaEl = currentTableCard.querySelector('.table-meta');
          if (metaEl && newCapacity) metaEl.textContent = `Capacity: ${newCapacity}`;

          if (result.image_path) {
            const img = currentTableCard.querySelector('.table-icon');
            if (img) img.src = normalizeImagePath(result.image_path);
          }

          closeModal('editTableModal');
          showAdminToast('Table updated');
        } else {
          showAdminToast(result.error || 'Update failed', true);
        }
      } catch {
        showAdminToast('Network error.', true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Changes';
      }
    });
  }

  function updateTableStats() {
    const cards = Array.from(document.querySelectorAll('.table-card'))
      .filter(card => card.dataset.tableId);
    let available = 0, reserved = 0, occupied = 0;
    cards.forEach(c => {
      if (c.dataset.status === 'available') available++;
      else if (c.dataset.status === 'reserved') reserved++;
      else if (c.dataset.status === 'occupied') occupied++;
    });
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('statTotal', cards.length);
    set('statAvailable', available);
    set('statReserved', reserved);
    set('statOccupied', occupied);
  }

  function normalizeImagePath(path) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('..')) return path;
    return `../${path}`;
  }

  function capitalize(value) {
    const str = String(value || '').toLowerCase();
    if (!str) return '';
    if (str === 'entrance') return 'Near Entrance';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Menu Item Approval ────────────────────────────────────
  const pendingMenuItems = document.getElementById('pendingMenuItems');
  if (pendingMenuItems) {
    pendingMenuItems.addEventListener('click', async (e) => {
      const btn = e.target.closest('.menu-approve-btn, .menu-reject-btn');
      if (!btn) return;
      const card = btn.closest('[data-menu-id]');
      if (!card) return;

      const menuId = card.dataset.menuId;
      const action = btn.dataset.action; // 'approve' or 'reject'
      try {
        const res = await fetch('../api/approve_menu_item.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipe_id: menuId, action }),
        });
        const result = await res.json();
        if (result.success) {
          if (action === 'approve') {
            const approvedGrid = document.getElementById('approvedMenuItems');
            if (approvedGrid) {
              const approvedCard = card.cloneNode(true);
              approvedCard.classList.remove('pending');
              approvedCard.classList.add('approved');

              const actionRow = approvedCard.querySelector('.menu-action-row');
              if (actionRow) actionRow.remove();

              if (!approvedCard.querySelector('.menu-check')) {
                const check = document.createElement('div');
                check.className = 'menu-check';
                check.innerHTML = '<i class="fas fa-check"></i>';
                approvedCard.prepend(check);
              }

              approvedGrid.prepend(approvedCard);
            }
          }

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
  }

  function updateMenuCount() {
    const pending = document.querySelectorAll('#pendingMenuItems [data-menu-id]').length;
    const approved = document.querySelectorAll('#approvedMenuItems [data-menu-id]').length;
    const pendingEl = document.getElementById('pendingMenuCount');
    const approvedEl = document.getElementById('approvedMenuCount');
    if (pendingEl) pendingEl.textContent = String(pending);
    if (approvedEl) approvedEl.textContent = String(approved);
  }

  const reservationRequests = document.getElementById('reservationRequests');

  function renderReservationRequests(reservations) {
    if (!reservationRequests) return;

    const pending = (reservations || []).filter(r => r.status === 'pending');
    if (!pending.length) {
      reservationRequests.innerHTML = '<div class="reservation-request"><p>No pending reservation requests.</p></div>';
      return;
    }

    const formatTimeRange = (r) => {
      const start = r.reserved_time || '';
      const end = r.reserved_end_time || '';
      return end ? `${start} - ${end}` : start;
    };

    reservationRequests.innerHTML = pending.map(r => `
      <div class="reservation-request" data-reservation-id="${r.id}">
        <div>
          <h4>Table ${r.table_number} - ${r.customer_name || 'Customer'}</h4>
          <p>${r.reserved_date} at ${formatTimeRange(r)} - ${r.guest_count} guests</p>
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
      const res = await fetch('../api/get_reservations_admin.php', {
        credentials: 'same-origin',
      });
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
          credentials: 'same-origin',
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
  const editMenuForm = document.getElementById('editMenuForm');
  let currentMenuCard = null;

  document.querySelectorAll('.menu-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.menu-card');
      if (!card) return;
      currentMenuCard = card;

      const nameEl = card.querySelector('.menu-name');
      const priceEl = card.querySelector('.menu-price');
      const descEl = card.querySelector('.menu-desc');
      const tagEl = card.querySelector('.menu-tag');

      if (nameEl) document.getElementById('editMenuName').value = nameEl.textContent;
      if (priceEl) document.getElementById('editMenuPrice').value = priceEl.textContent.replace(/[^0-9.]/g, '');
      if (descEl) document.getElementById('editMenuDesc').value = descEl.textContent;
      if (tagEl) document.getElementById('editMenuTag').value = tagEl.textContent;
      const prepInput = document.getElementById('editMenuPrepTime');
      if (prepInput) prepInput.value = parseInt(card.dataset.prepTime) || '';
      document.getElementById('editMenuImage').value = '';

      openModal('editMenuModal');
    });
  });

  if (editMenuForm) {
    editMenuForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = editMenuForm.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving…';

      try {
        const formData = new FormData(editMenuForm);
        // Attach the recipe id from the card
        if (currentMenuCard) formData.append('recipe_id', currentMenuCard.dataset.menuId || '');

        const res = await fetch('../api/update_menu_item.php', { method: 'POST', body: formData });
        const result = await res.json();

        if (result.success) {
          // Update DOM card
          if (currentMenuCard) {
            const n = currentMenuCard.querySelector('.menu-name');
            const p = currentMenuCard.querySelector('.menu-price');
            const d = currentMenuCard.querySelector('.menu-desc');
            const t = currentMenuCard.querySelector('.menu-tag');
            if (n) n.textContent = formData.get('editMenuName');
            if (p) {
              const priceValue = String(formData.get('editMenuPrice') || '').trim();
              p.textContent = priceValue ? `$${priceValue}` : '';
            }
            if (d) d.textContent = formData.get('editMenuDesc');
            if (t) t.textContent = formData.get('editMenuTag');

            const prepValue = parseInt(formData.get('editMenuPrepTime')) || 0;
            currentMenuCard.dataset.prepTime = prepValue;
            const prepTag = currentMenuCard.querySelector('.menu-prep-tag');
            const prepValueEl = currentMenuCard.querySelector('.menu-prep-value');
            if (prepValueEl) prepValueEl.textContent = prepValue;
            if (prepTag) prepTag.style.display = prepValue ? '' : 'none';
          }
          closeModal('editMenuModal');
          showAdminToast('Menu item updated!');
        } else {
          showAdminToast(result.error || 'Update failed', true);
        }
      } catch {
        showAdminToast('Network error.', true);
      } finally {
        submitBtn.disabled = false;
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
          <div class="customer-avatar">
            <img src="${escapeHtml(customer.avatar_path ? ('../' + customer.avatar_path) : '../Images/Customer/pexels-emad-hussien-830139385-27856326.jpg')}" alt="${escapeHtml(customer.name)}"/>
          </div>
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
          <div class="customer-avatar">
            <img src="${escapeHtml(customer.avatar_path ? ('../' + customer.avatar_path) : '../Images/Customer/pexels-emad-hussien-830139385-27856326.jpg')}" alt="${escapeHtml(customer.name)}"/>
          </div>
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

  const conversationList = document.getElementById('conversationList');
  const chatThread = document.getElementById('chatThread');
  const chatPanelTitle = document.getElementById('chatPanelTitle');
  const chatPanelSubtitle = document.getElementById('chatPanelSubtitle');
  const chatReplyForm = document.getElementById('chatReplyForm');
  const chatReplyInput = document.getElementById('chatReplyInput');

  let selectedChatSession = null;
  let chatPollTimer = null;
  let lastChatSignature = '';

  function formatChatDate(value) {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString();
  }

  function startChatPolling() {
    if (chatPollTimer) clearInterval(chatPollTimer);
    chatPollTimer = setInterval(() => {
      const chatSection = document.getElementById('chat');
      if (!chatSection || !chatSection.classList.contains('active')) return;
      
      loadChatConversations();
      if (selectedChatSession) {
        loadChatHistory(selectedChatSession);
      }
    }, 4000);
  }

  startChatPolling();

  function renderConversationList(conversations) {
    if (!conversationList) return;
    const previousScrollTop = conversationList.scrollTop;
    const activeSessionId = selectedChatSession;

    if (!Array.isArray(conversations) || conversations.length === 0) {
      conversationList.innerHTML = '<div class="empty-state"><p>No chat conversations yet.</p></div>';
      return;
    }

    conversationList.innerHTML = conversations.map(conv => `
      <div class="chat-conversation-item" data-session-id="${escapeHtml(conv.session_id)}">
        <strong>${escapeHtml(conv.participants || 'Guest')}</strong>
        <span>Last activity: ${formatChatDate(conv.last_activity)}</span>
        <span>${conv.last_user_message ? 'Recent guest message' : 'No guest message yet'}</span>
      </div>
    `).join('');

    if (activeSessionId) {
      [...conversationList.querySelectorAll('.chat-conversation-item')]
        .find(item => item.dataset.sessionId === activeSessionId)
        ?.classList.add('active');
    }
    conversationList.scrollTop = previousScrollTop;
  }

  async function loadChatConversations() {
    if (!conversationList) return;
    try {
      const res = await fetch('../api/get_chat_conversations.php', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.success) {
        renderConversationList(data.conversations);
      } else {
        conversationList.innerHTML = '<div class="empty-state"><p>Could not load conversations.</p></div>';
      }
    } catch (err) {
      console.error(err);
      conversationList.innerHTML = '<div class="empty-state"><p>Could not load conversations.</p></div>';
    }
  }

  async function loadChatHistory(sessionId) {
    if (!chatThread) return;
    const isNewSession = selectedChatSession !== sessionId;
    selectedChatSession = sessionId;
    chatPanelTitle.textContent = 'Conversation';
    if (isNewSession) {
      lastChatSignature = '';
      chatPanelSubtitle.textContent = 'Loading messages...';
      chatThread.innerHTML = '<div class="empty-state"><p>Loading chat history...</p></div>';
    }
    const distanceFromBottom = chatThread.scrollHeight - chatThread.scrollTop - chatThread.clientHeight;
    const wasAtBottom = isNewSession || distanceFromBottom < 70;
    const previousScrollHeight = chatThread.scrollHeight;
    const previousScrollTop = chatThread.scrollTop;
    if (chatReplyInput && isNewSession) chatReplyInput.disabled = true;

    try {
      const res = await fetch(`../api/get_chat_history.php?session_id=${encodeURIComponent(sessionId)}`, { credentials: 'same-origin' });
      const data = await res.json();
      if (data.success) {
        const messages = Array.isArray(data.messages) ? data.messages : [];
        const signature = messages.map(msg => `${msg.id || ''}:${msg.created_at || ''}`).join('|');

        if (!isNewSession && signature === lastChatSignature) {
          chatPanelSubtitle.textContent = `Session: ${data.session_id}`;
          return;
        }

        lastChatSignature = signature;

        if (messages.length === 0) {
          chatThread.innerHTML = '<div class="empty-state"><p>No messages in this conversation yet.</p></div>';
        } else {
          chatThread.innerHTML = '';
          messages.forEach(msg => {
            const item = document.createElement('div');
            item.className = `chat-message ${msg.source === 'user' ? 'user' : 'bot'}`;
            const author = msg.source === 'user' ? (msg.name || msg.email || 'Guest') : (msg.role === 'admin' ? 'Admin' : 'Bot');
            item.innerHTML = `<div>${escapeHtml(msg.message)}</div><span class="meta">${escapeHtml(author)} · ${formatChatDate(msg.created_at)}</span>`;
            chatThread.appendChild(item);
          });
          if (wasAtBottom) {
            chatThread.scrollTop = chatThread.scrollHeight;
          }
        }
        if (!wasAtBottom) {
          const heightDiff = chatThread.scrollHeight - previousScrollHeight;
          chatThread.scrollTop = previousScrollTop + Math.max(0, heightDiff);
        }
        chatPanelSubtitle.textContent = `Session: ${data.session_id}`;
      } else if (isNewSession) {
        chatThread.innerHTML = '<div class="empty-state"><p>Could not load this conversation.</p></div>';
      }
    } catch (err) {
      console.error(err);
      if (isNewSession) {
        chatThread.innerHTML = '<div class="empty-state"><p>Could not load this conversation.</p></div>';
      }
    } finally {
      if (chatReplyInput) chatReplyInput.disabled = false;
    }
  }

  function selectConversationElement(el) {
    document.querySelectorAll('.chat-conversation-item').forEach(item => item.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  if (conversationList) {
    conversationList.addEventListener('click', event => {
      const item = event.target.closest('.chat-conversation-item');
      if (!item) return;
      const sessionId = item.dataset.sessionId;
      if (!sessionId) return;
      selectConversationElement(item);
      loadChatHistory(sessionId);
    });
  }

  if (chatReplyForm) {
    chatReplyForm.addEventListener('submit', async e => {
      e.preventDefault();
      if (!selectedChatSession) {
        showAdminToast('Please select a conversation first.', true);
        return;
      }
      const text = (chatReplyInput?.value || '').trim();
      if (!text) return;
      const submitBtn = chatReplyForm.querySelector('button');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }
      try {
        const res = await fetch('../api/save_chat.php', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, source: 'bot', session_id: selectedChatSession })
        });
        const result = await res.json();
        if (result.success) {
          chatReplyInput.value = '';
          lastChatSignature = '';
          await loadChatHistory(selectedChatSession);
          chatThread.scrollTop = chatThread.scrollHeight;
          await loadChatConversations();
          showAdminToast('Reply sent.');
        } else {
          showAdminToast(result.error || 'Could not send reply.', true);
        }
      } catch (err) {
        console.error(err);
        showAdminToast('Network error.', true);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send';
        }
      }
    });
  }

  if (document.querySelector('.tab[data-section="chat"]')) {
    document.querySelector('.tab[data-section="chat"]').addEventListener('click', loadChatConversations);
  }

  // Load chat conversations when the page loads if chat section is active by default.
  if (document.querySelector('.section-content#chat.active')) {
    loadChatConversations();
  }

  // ── Financial Reports ───────────────────────────────────
  const reportStart = document.getElementById('reportStart');
  const reportEnd = document.getElementById('reportEnd');
  const reportTotalRevenue = document.getElementById('reportTotalRevenue');
  const reportTotalOrders = document.getElementById('reportTotalOrders');
  const reportAvgOrderValue = document.getElementById('reportAvgOrderValue');
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  const reportFormat = document.getElementById('reportFormat');

  function getReportSettings() {
    const start = reportStart?.value || '';
    const end = reportEnd?.value || '';
    const format = reportFormat?.value || 'csv';
    return { start, end, format };
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
      const { start, end } = getReportSettings();
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
      const { start, end, format } = getReportSettings();
      const url = `../api/get_financial_report.php?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&format=${format}`;
      window.location.href = url;
    });
  }

  loadFinancialReport();

  // ── Toast ─────────────────────────────────────────────────
  function showAdminToast(msg, isError = false) {
    const toast = document.getElementById('adminToast');
    if (!toast) return;

    const msgEl = toast.querySelector('.toast-msg');
    const iconEl = toast.querySelector('.toast-icon i');

    if (msgEl) msgEl.textContent = msg;
    if (iconEl) {
      iconEl.className = isError ? 'fas fa-exclamation-triangle' : 'fas fa-check';
    }

    toast.classList.toggle('error', isError);
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // ── Order cards status (chief page uses admin.js too) ─────
  document.querySelectorAll('.order-card').forEach(card => {
    const statusEl = card.querySelector('.status-badge');
    const actionBtn = card.querySelector('[data-mark-ready]');
    if (!actionBtn || !statusEl) return;

    const status = (statusEl.textContent || '').trim().toLowerCase();
    if (status === 'ready' || status === 'served') {
      actionBtn.hidden = true;
      actionBtn.disabled = true;
      return;
    }

    actionBtn.addEventListener('click', async () => {
      const orderId = card.dataset.orderId;
      if (orderId) {
        try {
          await fetch('../api/update_order_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: 'ready' }),
          });
        } catch { }
      }
      statusEl.textContent = 'Ready';
      actionBtn.textContent = '✓ Ready';
      actionBtn.disabled = true;
      setTimeout(() => { actionBtn.hidden = true; }, 400);
    });
  });

  // ── Admin Orders (Guest Delivery) ───────────────────────
  async function loadAdminOrders() {
    const grid = document.getElementById('adminOrdersGrid');
    if (!grid) return;

    try {
      const res = await fetch('../api/get_guest_orders.php');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      if (data.orders.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No guest orders currently.</p></div>';
        return;
      }

      // Sort orders: active on top, completed at bottom, by date descending
      data.orders.sort((a, b) => {
        const aStatus = (a.status || '').toLowerCase();
        const bStatus = (b.status || '').toLowerCase();
        const aCompleted = (aStatus === 'delivered' || aStatus === 'served' || aStatus === 'paid');
        const bCompleted = (bStatus === 'delivered' || bStatus === 'served' || bStatus === 'paid');
        if (aCompleted && !bCompleted) return 1;
        if (!aCompleted && bCompleted) return -1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });

      grid.innerHTML = data.orders.map(order => {
        let itemsHtml = '';
        let cardSubtotal = 0;

        order.items.forEach(i => {
          const qty = parseInt(i.quantity) || 0;
          const price = parseFloat(i.price) || 0;
          const sub = parseFloat(i.subtotal) || (qty * price);
          cardSubtotal += sub;
          itemsHtml += `<div>${qty}× ${escapeHtml(i.name)}</div>`;
        });

        const cardTotal = parseFloat(order.total_amount) || (cardSubtotal * 1.10);
        const cardTax = Math.max(0, cardTotal - cardSubtotal);

        const status = (order.status || 'queued').toLowerCase();
        let statusDisplay = status;
        if (status === 'queued' || status === 'in_progress') statusDisplay = 'In Kitchen';
        else if (status === 'ready') statusDisplay = 'Ready';
        else if (status === 'served' || status === 'delivered') statusDisplay = 'Delivered';
        else if (status === 'paid') statusDisplay = 'Paid';

        const timeStr = order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
        const isAssigned = !!order.waiter_id;
        const assignedWaiterName = isAssigned ? escapeHtml(data.waiters.find(w => w.id == order.waiter_id)?.name || 'Unknown Waiter') : '';

        const waiterSelect = `<select class="assign-waiter-select" data-order-id="${order.id}" aria-label="Assign waiter">
            <option value="">— Assign Waiter —</option>
            ${data.waiters.map(w => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join('')}
          </select>`;

        return `
          <div class="delivery-order-card" style="display:flex; flex-direction:column; gap:16px; background:var(--card-bg); border:1px solid var(--glass-border); border-radius:16px; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:20px;">
              <div style="flex:1;">
                <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px;">
                  <div style="width:56px; height:56px; border-radius:12px; background:#333; color:#c8a96a; font-size:20px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fas fa-motorcycle"></i>
                  </div>
                  <div>
                    <div style="font-size:18px; font-weight:800; color:#fff;">Delivery Order #${order.id}</div>
                    <div style="font-size:13px; color:var(--text-secondary);">${escapeHtml(order.guest_name || 'Guest')}</div>
                    <div style="font-size:13px; color:var(--text-secondary);"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.delivery_address || 'No Address Provided')}</div>
                    <div style="font-size:13px; color:var(--text-secondary);">${timeStr}</div>
                  </div>
                </div>
                <div style="padding:12px 16px; background:rgba(255,255,255,0.04); border-radius:10px; font-size:14px; color:var(--text-secondary); margin-bottom:10px;">
                  ${itemsHtml || 'No items'}
                </div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0;">
                <span class="delivery-status delivery-status--${status}" style="padding:8px 14px; font-size:12px;">${statusDisplay.toUpperCase()}</span>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-top:8px;">
                  ${order.items.map(i => {
          const qty = parseInt(i.quantity) || 0;
          const price = parseFloat(i.price) || 0;
          return `<div style="font-size:12px; color:rgba(254,254,255,0.85); font-weight:700;">${qty}× $${price.toFixed(2)} = $${(qty * price).toFixed(2)}</div>`;
        }).join('')}
                  <div style="font-size:12px; color:rgba(254,254,255,0.85); font-weight:700;">Subtotal: $${cardSubtotal.toFixed(2)}</div>
                  <div style="font-size:12px; color:rgba(254,254,255,0.85); font-weight:700;">Tax (10%): $${cardTax.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <!-- Full Width Total Row -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08); margin-bottom:4px;">
              <span style="font-size:16px; font-weight:700; color:#fff;">Total (incl. tax)</span>
              <span style="font-size:20px; font-weight:900; color:var(--gold);">$${cardTotal.toFixed(2)}</span>
            </div>

            <div class="delivery-assign-row" style="margin-top:auto; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
              ${isAssigned ? `
                <div style="flex:1; display:flex; align-items:center; gap:8px; padding:10px 14px; background:rgba(74,222,128,0.1); border-radius:10px; border:1px solid rgba(74,222,128,0.2);">
                  <i class="fas fa-user-check" style="color:var(--green);"></i>
                  <span style="font-weight:700; color:var(--green); font-size:14px;">Assigned to: ${assignedWaiterName}</span>
                </div>
              ` : `
                <div class="assign-waiter-field" style="flex:1;">
                  <i class="fas fa-user-tie"></i>
                  ${waiterSelect}
                </div>
                <button class="assign-waiter-btn" data-order-id="${order.id}">
                  <i class="fas fa-check"></i> Assign
                </button>
              `}
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
      grid.innerHTML = '<div class="empty-state"><p>Failed to load orders.</p></div>';
    }
  }

  const adminOrdersGrid = document.getElementById('adminOrdersGrid');
  if (adminOrdersGrid) {
    adminOrdersGrid.addEventListener('click', async (e) => {
      const btn = e.target.closest('.assign-waiter-btn');
      if (!btn) return;

      const orderId = btn.dataset.orderId;
      const select = document.querySelector(`.assign-waiter-select[data-order-id="${orderId}"]`);
      const waiterId = select.value;

      if (!waiterId) {
        showAdminToast('Please select a waiter first.', true);
        return;
      }

      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

      try {
        const res = await fetch('../api/assign_order_waiter.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId, waiter_id: waiterId })
        });
        const result = await res.json();
        if (result.success) {
          showAdminToast('Waiter assigned successfully!');
          loadAdminOrders();
          return; // grid re-rendered; nothing to restore
        }
        showAdminToast(result.error || 'Failed to assign waiter', true);
      } catch (err) {
        showAdminToast('Network error.', true);
      }
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    });
  }

  // Initial loads
  updateTableStats();
  updateMenuCount();
  if (window.location.href.includes('Admin.php')) {
    loadAdminOrders();
  }
}); // end DOMContentLoaded
