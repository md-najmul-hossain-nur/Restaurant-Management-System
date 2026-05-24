/* ==========================================
   Table Data Store
   ★ Still used for images, descriptions, pills
     (these are UI details, not stored in your DB)
     Real availability status comes from the API.
========================================== */
const tableData = [
  {
    key:      'table1',
    name:     'Table 1',
    title:    'Intimate Duo Table',
    subtitle: 'Ground Floor · Cozy Corner',
    image:    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=900&q=80',
    desc:     'A snug two-seater tucked in a warm corner, perfect for an intimate dinner for two. Soft candlelight and a quiet ambiance make this table ideal for date nights or private conversations.',
    capacity: 2, floor: 'GF', rating: '★ 4.7', setting: 'Corner',
    pills: [
      { icon: 'fas fa-heart',       label: 'Romantic'   },
      { icon: 'fas fa-users',       label: '2 Seats'    },
      { icon: 'fas fa-moon',        label: 'Candlelit'  },
      { icon: 'fas fa-volume-mute', label: 'Quiet Zone' },
    ],
  },
  {
    key:      'table2',
    name:     'Table 2',
    title:    'Garden View Table',
    subtitle: 'Ground Floor · Garden Side',
    image:    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=900&q=80',
    desc:     'Beside a large glass panel overlooking our lush herb garden, Table 2 floods with natural light during the day and warm ambient glow at night. A favourite for brunch and relaxed lunches.',
    capacity: 2, floor: 'GF', rating: '★ 4.6', setting: 'Garden Side',
    pills: [
      { icon: 'fas fa-seedling', label: 'Garden View'     },
      { icon: 'fas fa-users',    label: '2 Seats'         },
      { icon: 'fas fa-sun',      label: 'Natural Light'   },
      { icon: 'fas fa-coffee',   label: 'Brunch Favourite'},
    ],
  },
  {
    key:      'table3',
    name:     'Table 3',
    title:    'Classic Centre Table',
    subtitle: 'Ground Floor · Main Dining',
    image:    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
    desc:     'Sitting at the heart of the main dining room, Table 3 gives guests the full atmosphere of Feliciano — the hum of conversation, the aroma of the kitchen, and an unobstructed view of the entire floor.',
    capacity: 4, floor: 'GF', rating: '★ 4.8', setting: 'Main Hall',
    pills: [
      { icon: 'fas fa-star',     label: 'Most Popular'    },
      { icon: 'fas fa-users',    label: '4 Seats'         },
      { icon: 'fas fa-utensils', label: 'Kitchen View'    },
      { icon: 'fas fa-globe',    label: 'Full Atmosphere' },
    ],
  },
  {
    key:      'table4',
    name:     'Table 4',
    title:    'Bay Window Booth',
    subtitle: 'Ground Floor · Street Side',
    image:    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=900&q=80',
    desc:     'A cosy booth framed by a wide bay window facing the street. Upholstered bench seating and a private feel make it a go-to for small family gatherings or a relaxed group meal.',
    capacity: 4, floor: 'GF', rating: '★ 4.7', setting: 'Booth',
    pills: [
      { icon: 'fas fa-eye',   label: 'Street View'    },
      { icon: 'fas fa-users', label: '4 Seats'        },
      { icon: 'fas fa-couch', label: 'Booth Seating'  },
      { icon: 'fas fa-child', label: 'Family Friendly'},
    ],
  },
  {
    key:      'table5',
    name:     'Table 5',
    title:    'Signature Window Table',
    subtitle: 'Ground Floor · Panoramic View',
    image:    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
    desc:     'Positioned at the heart of our dining floor, Table 5 offers a sweeping panoramic view through floor-to-ceiling windows overlooking the garden courtyard.',
    capacity: 4, floor: 'GF', rating: '★ 4.9', setting: 'Indoor',
    pills: [
      { icon: 'fas fa-eye',        label: 'Window View'      },
      { icon: 'fas fa-users',      label: '4 Seats'          },
      { icon: 'fas fa-leaf',       label: 'Garden Facing'    },
      { icon: 'fas fa-lightbulb',  label: 'Ambient Lighting' },
    ],
  },
  {
    key:      'table6',
    name:     'Table 6',
    title:    'Terrace Round Table',
    subtitle: 'First Floor · Open Terrace',
    image:    'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=900&q=80',
    desc:     'Set on our open-air terrace on the first floor, Table 6 is a round six-seater with a beautiful city skyline backdrop.',
    capacity: 6, floor: 'F1', rating: '★ 4.8', setting: 'Outdoor',
    pills: [
      { icon: 'fas fa-cloud-sun',   label: 'Open Air'        },
      { icon: 'fas fa-users',       label: '6 Seats'         },
      { icon: 'fas fa-city',        label: 'Skyline View'    },
      { icon: 'fas fa-glass-cheers',label: 'Events Friendly' },
    ],
  },
  {
    key:      'table7',
    name:     'Table 7',
    title:    'Private Corner Alcove',
    subtitle: 'Mezzanine Level · Quiet Corner',
    image:    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80',
    desc:     'Tucked into a quiet alcove on our mezzanine level, Table 7 is our most requested table for couples and intimate groups seeking privacy.',
    capacity: 6, floor: 'M1', rating: '★ 4.8', setting: 'Alcove',
    pills: [
      { icon: 'fas fa-lock',        label: 'Private Setting'   },
      { icon: 'fas fa-users',       label: '6 Seats'           },
      { icon: 'fas fa-wine-bottle', label: 'Wine Shelf Nearby' },
      { icon: 'fas fa-volume-mute', label: 'Quiet Zone'        },
    ],
  },
  {
    key:      'table8',
    name:     'Table 8',
    title:    'Grand Banquet Table',
    subtitle: 'First Floor · Private Dining Room',
    image:    'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=900&q=80',
    desc:     'Our largest table, housed in a semi-private dining room on the first floor. Perfect for corporate events, large family celebrations, or group dinners.',
    capacity: 8, floor: 'F1', rating: '★ 5.0', setting: 'Private Room',
    pills: [
      { icon: 'fas fa-crown',          label: 'Premium Table'   },
      { icon: 'fas fa-users',          label: '8 Seats'         },
      { icon: 'fas fa-concierge-bell', label: 'Dedicated Server'},
      { icon: 'fas fa-door-closed',    label: 'Semi-Private'    },
    ],
  },
];

/* ==========================================
   Lookup by key
========================================== */
function getTableByKey(key) {
  return getDisplayTables().find(t => t.key === key)
    || tableData.find(t => t.key === key)
    || null;
}

/* ==========================================
   ★ NEW — Load real availability from DB
   Merges DB status into the local tableData
   so the browser shows accurate availability
========================================== */
let dbTables = [];
let dbTableStatuses = {}; // { table_number: 'available'|'reserved'|'occupied' }
let dbTableByNumber = {}; // { table_number: table row }

function buildTableFromDb(row) {
  const tableNum = parseInt(row.table_number);
  const local = tableData.find(t => t.key === `table${tableNum}`) || {};
  const imagePath = row.image_path
    ? row.image_path.replace(/^\.\.\//, '../')
    : local.image;

  return {
    ...local,
    key: `table${tableNum}`,
    id: parseInt(row.id),
    tableNumber: tableNum,
    name: `Table ${tableNum}`,
    title: local.title || `${row.position || 'Restaurant'} Table`,
    subtitle: local.subtitle || `${row.position || 'Dining Area'} · ${row.capacity} seats`,
    image: imagePath || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
    desc: local.desc || 'A comfortable Feliciano table ready for your reservation.',
    capacity: parseInt(row.capacity) || local.capacity || 1,
    floor: local.floor || '-',
    rating: local.rating || 'New',
    setting: local.setting || row.position || 'Dining',
    status: row.status || 'available',
    pills: local.pills || [
      { icon: 'fas fa-chair', label: 'Restaurant Table' },
      { icon: 'fas fa-users', label: `${row.capacity} Seats` },
      { icon: 'fas fa-map-marker-alt', label: row.position || 'Dining Area' },
    ],
  };
}

function getDisplayTables() {
  if (dbTables.length) return dbTables.map(buildTableFromDb);
  return tableData.map(t => ({
    ...t,
    id: parseInt(t.key.replace('table', '')),
    tableNumber: parseInt(t.key.replace('table', '')),
    status: dbTableStatuses[parseInt(t.key.replace('table', ''))] || 'available',
  }));
}

async function loadTableStatuses() {
  try {
    const res    = await fetch('../api/get_tables.php');
    const tables = await res.json();

    dbTables = Array.isArray(tables) ? tables : [];
    dbTableByNumber = {};
    dbTableStatuses = {};

    dbTables.forEach(t => {
      dbTableStatuses[t.table_number] = t.status;
      dbTableByNumber[t.table_number] = t;
    });

    renderTableChips();

    // If browser is already showing the table grid, refresh it
    const grid = document.getElementById('tableBrowserGrid');
    if (grid && grid.innerHTML.trim() !== '') {
      renderBrowserGrid();
    }
  } catch (err) {
    console.error('Could not load table statuses:', err);
  }
}

/* ==========================================
   STEP 1 — Table Browser Modal
   Now shows real availability badge from DB
========================================== */
function openBookingBrowser() {
  renderBrowserGrid();
  openModal('tableBrowserOverlay');
}

function renderBrowserGrid() {
  const grid = document.getElementById('tableBrowserGrid');
  grid.innerHTML = getDisplayTables().map(t => {
    const tableNum = t.tableNumber || parseInt(t.key.replace('table', ''));
    const status   = t.status || dbTableStatuses[tableNum] || 'available';
    const isBlocked = status !== 'available';
    const badgeHTML = status !== 'available'
      ? `<span class="browser-card-status-badge ${status}">${status}</span>`
      : '';

    return `
      <div class="browser-card ${isBlocked ? 'blocked' : ''}"
           onclick="${isBlocked ? '' : `openTablePreview('${t.key}')`}">
        <div class="browser-card-img-wrap">
          <img src="${t.image}" alt="${t.name}" loading="lazy"/>
          <span class="browser-card-badge">${t.name}</span>
          <span class="browser-card-cap"><i class="fas fa-users"></i> ${t.capacity} seats</span>
          ${badgeHTML}
        </div>
        <div class="browser-card-body">
          <div class="browser-card-title">${t.title}</div>
          <div class="browser-card-subtitle">${t.subtitle}</div>
          <p class="browser-card-desc">${t.desc}</p>
          <div class="browser-card-pills">
            ${t.pills.slice(0, 3).map(p =>
              `<span class="pill"><i class="${p.icon}"></i>${p.label}</span>`
            ).join('')}
          </div>
          <button class="browser-select-btn"
                  ${isBlocked ? 'disabled' : ''}
                  onclick="event.stopPropagation(); selectAndBook('${t.key}')">
            <i class="fas fa-calendar-plus"></i>
            ${isBlocked ? 'Not Available' : 'Reserve This Table'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================
   STEP 2 — Table Detail Modal  (unchanged)
========================================== */
function openTablePreview(tableKey) {
  const t = getTableByKey(tableKey);
  if (!t) return;
  populateDetailModal(t);
  document.getElementById('detailReserveBtn').onclick = () => {
    closeModal('tableDetailOverlay');
    closeModal('tableBrowserOverlay');
    openBookingForm(tableKey);
  };
  openModal('tableDetailOverlay');
}

/* ==========================================
   STEP 3 — Booking Form  (unchanged logic)
========================================== */
function selectAndBook(tableKey) {
  closeModal('tableBrowserOverlay');
  openBookingForm(tableKey);
}

function openBookingForm(tableKey) {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookDate').value = today;

  document.querySelectorAll('.table-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.table === tableKey.replace('table', ''));
  });

  openModal('bookingOverlay');
}

function selectTable(el) {
  document.querySelectorAll('.table-chip').forEach(c => {
    c.classList.remove('selected', 'over-capacity');
  });
  el.classList.add('selected');
  checkCapacity();
}

/* ==========================================
   Capacity Warning Logic  (unchanged)
========================================== */
let tableCapacities = { 1:2, 2:2, 3:4, 4:4, 5:4, 6:6, 7:6, 8:8 };

function renderTableChips() {
  const grid = document.getElementById('tableChipGrid');
  if (!grid) return;

  const tables = getDisplayTables();
  tableCapacities = {};

  grid.innerHTML = tables.map(t => {
    const tableNum = t.tableNumber || parseInt(t.key.replace('table', ''));
    tableCapacities[tableNum] = t.capacity;

    return `
      <div class="table-chip" onclick="selectTable(this)" data-table="${tableNum}">
        <i class="fas fa-chair"></i>
        <span>Table ${tableNum}</span>
        <span class="chip-cap">${t.capacity} seats</span>
      </div>
    `;
  }).join('');
}

function getSelectedGuests() {
  const val = document.getElementById('bookGuests').value;
  if (val.startsWith('7')) return 8;
  return parseInt(val) || 1;
}

function checkCapacity() {
  const selectedChip = document.querySelector('.table-chip.selected');
  const warning      = document.getElementById('capacityWarning');
  const msgEl        = document.getElementById('capacityWarningMsg');
  const submitBtn    = document.getElementById('bookingSubmitBtn');

  if (!selectedChip) { warning.classList.remove('show'); return; }

  const tableNum = parseInt(selectedChip.dataset.table);
  const capacity = tableCapacities[tableNum];
  const guests   = getSelectedGuests();

  if (guests > capacity) {
    msgEl.textContent =
      `Table ${tableNum} seats up to ${capacity} guest${capacity > 1 ? 's' : ''}, ` +
      `but you've selected ${guests}. Please choose a larger table.`;
    warning.classList.add('show');
    submitBtn.disabled = true;
    submitBtn.classList.add('disabled');
    selectedChip.classList.add('over-capacity');
  } else {
    warning.classList.remove('show');
    submitBtn.disabled = false;
    submitBtn.classList.remove('disabled');
    selectedChip.classList.remove('over-capacity');
  }
}

/* ==========================================
   ★ NEW — Submit Booking to Database
   Replaces the fake toast-only version
========================================== */
async function submitBooking() {
  const selectedChip = document.querySelector('.table-chip.selected');
  if (!selectedChip) {
    showToast('Please select a table first.');
    return;
  }

  const tableNum = parseInt(selectedChip.dataset.table);
  const date     = document.getElementById('bookDate').value;
  const time     = document.getElementById('bookTime').value;
  const guests   = getSelectedGuests();
  const special  = document.querySelector('.form-group .form-input[placeholder]')?.value || '';

  if (!date) {
    showToast('Please select a date.');
    return;
  }

  const tableId = parseInt(dbTableByNumber[tableNum]?.id || tableNum);
  if (!tableId) {
    showToast('Table not found. Please try again.');
    return;
  }

  const submitBtn = document.getElementById('bookingSubmitBtn');
  submitBtn.disabled    = true;
  submitBtn.textContent = 'Booking…';

  try {
    const res    = await fetch('../api/book_table.php', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id:         tableId,
        date,
        time,
        guests,
        special_requests: special,
      }),
    });
    const result = await res.json();

    if (result.success) {
      // Save table id to sessionStorage so order page can use it
      sessionStorage.setItem('selectedTableId', tableId);
      closeModal('bookingOverlay');
      showToast("Reservation request sent! We'll confirm shortly.");
      // Refresh status badges
      await loadTableStatuses();
      await loadReservations();
    } else {
      showToast(result.error || 'Could not complete booking.', true);
    }
  } catch (err) {
    console.error(err);
    showToast('Network error. Please try again.');
  } finally {
    submitBtn.disabled    = false;
    submitBtn.innerHTML   = '<i class="fas fa-check"></i> Confirm Reservation';
  }
}

/* ==========================================
   View Table Details — Reservation Cards  (unchanged)
========================================== */
function formatReservationDate(date, time) {
  if (!date) return 'Date not set';
  const safeTime = time || '00:00';
  const d = new Date(`${date}T${safeTime}`);
  if (Number.isNaN(d.getTime())) return `${date} at ${safeTime}`;
  return d.toLocaleDateString(undefined, {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }) + ` at ${safeTime.slice(0, 5)}`;
}

function getReservationStatus(status) {
  const normalized = (status || 'pending').toLowerCase();
  const data = {
    pending:   { cls: 'pending',   icon: 'fas fa-clock',        label: 'Pending',   msg: 'Waiting for admin approval.' },
    approved:  { cls: 'approved',  icon: 'fas fa-check-circle', label: 'Approved',  msg: 'Your reservation is approved. See you soon.' },
    confirmed: { cls: 'confirmed', icon: 'fas fa-check-circle', label: 'Confirmed', msg: 'Your reservation is confirmed. See you soon.' },
    rejected:  { cls: 'rejected',  icon: 'fas fa-times-circle', label: 'Rejected',  msg: 'This reservation was not approved.' },
    cancelled: { cls: 'cancelled', icon: 'fas fa-ban',          label: 'Cancelled', msg: 'This reservation was cancelled.' },
  };
  return data[normalized] || data.pending;
}

function renderReservations(reservations) {
  const list = document.getElementById('reservationsList');
  if (!list) return;

  if (!Array.isArray(reservations) || reservations.length === 0) {
    list.innerHTML = '<div class="reservations-empty">No reservations yet. Click Book a Table to send a reservation request.</div>';
    return;
  }

  list.innerHTML = reservations.map(r => {
    const tableNum = parseInt(r.table_number);
    const status = getReservationStatus(r.status);
    const canCancel = ['pending', 'approved', 'confirmed'].includes((r.status || '').toLowerCase());

    return `
      <div class="reservation-card" data-reservation-id="${r.id}">
        <div class="card-top-row">
          <span class="table-name">Table ${tableNum}</span>
          <span class="status-badge ${status.cls}">
            <i class="${status.icon}"></i> ${status.label}
          </span>
        </div>
        <div class="card-meta">
          <span><i class="far fa-calendar"></i> ${formatReservationDate(r.reserved_date, r.reserved_time)}</span>
          <span><i class="fas fa-users"></i> ${r.guest_count} guests</span>
        </div>
        <div class="confirmation-msg">
          <i class="${status.icon}"></i>
          ${status.msg}
        </div>
        <div class="card-footer-row">
          <button class="view-details-btn" onclick="viewReservationTable('table${tableNum}')">
            <i class="fas fa-eye"></i> View Table Details
          </button>
          ${canCancel ? `
            <button class="cancel-btn" onclick="cancelReservation(${r.id})">
              <i class="fas fa-times"></i> Cancel
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function loadReservations() {
  const list = document.getElementById('reservationsList');
  if (list) list.innerHTML = '<div class="reservations-empty">Loading reservations...</div>';

  try {
    const res = await fetch('../api/get_my_reservations.php');
    const result = await res.json();

    if (res.ok && Array.isArray(result)) {
      renderReservations(result);
      return;
    }

    if (res.status === 401) {
      renderReservations([]);
      return;
    }

    if (list) list.innerHTML = `<div class="reservations-empty">${result.error || 'Could not load reservations.'}</div>`;
  } catch (err) {
    console.error(err);
    if (list) list.innerHTML = '<div class="reservations-empty">Could not load reservations. Please try again.</div>';
  }
}

async function cancelReservation(reservationId) {
  try {
    const res = await fetch('../api/cancel_reservation.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation_id: reservationId }),
    });
    const result = await res.json();

    if (result.success) {
      showToast('Reservation cancelled.');
      await loadReservations();
      await loadTableStatuses();
    } else {
      showToast(result.error || 'Could not cancel reservation.', true);
    }
  } catch (err) {
    console.error(err);
    showToast('Network error. Please try again.', true);
  }
}

function viewReservationTable(tableKey) {
  const t = getTableByKey(tableKey);
  if (!t) return;
  populateDetailModal(t);
  document.getElementById('detailReserveBtn').onclick = () => closeModal('tableDetailOverlay');
  document.getElementById('detailReserveBtn').innerHTML = '<i class="fas fa-times"></i> Close';
  openModal('tableDetailOverlay');
}

/* ==========================================
   Populate Detail Modal  (unchanged)
========================================== */
function populateDetailModal(t) {
  document.getElementById('modalImage').src            = t.image;
  document.getElementById('modalBadge').textContent    = t.name;
  document.getElementById('modalTitle').textContent    = t.title;
  document.getElementById('modalSubtitle').textContent = t.subtitle;
  document.getElementById('modalDesc').textContent     = t.desc;

  document.getElementById('modalPills').innerHTML = t.pills.map(p =>
    `<span class="pill"><i class="${p.icon}"></i>${p.label}</span>`
  ).join('');

  document.getElementById('modalStats').innerHTML = [
    { value: t.capacity, label: 'Seats'        },
    { value: t.floor,    label: 'Floor'        },
    { value: t.rating,   label: 'Guest Rating' },
    { value: t.setting,  label: 'Setting'      },
  ].map(s =>
    `<div class="stat-item">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>`
  ).join('');

  document.getElementById('detailReserveBtn').innerHTML =
    '<i class="fas fa-calendar-plus"></i> Reserve This Table';
}

/* ==========================================
   Modal Helpers  (unchanged)
========================================== */
function openModal(id)  { document.getElementById(id)?.classList.add('open');    }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function handleOverlayClick(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['tableDetailOverlay', 'tableBrowserOverlay', 'bookingOverlay'].forEach(closeModal);
  }
});

/* ==========================================
   Toast  (unchanged)
========================================== */
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.style.background = isError ? 'rgba(127,29,29,0.92)' : 'rgba(46,125,50,0.90)';
  t.style.borderColor = isError ? 'rgba(252,165,165,0.42)' : 'rgba(129,199,132,0.40)';
  t.style.color = isError ? '#fee2e2' : '#c8f5cb';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3800);
}

/* ==========================================
   Boot
========================================== */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bookGuests').addEventListener('change', checkCapacity);
  renderTableChips();
  loadTableStatuses(); // ★ load real availability on page load
  loadReservations();
});
