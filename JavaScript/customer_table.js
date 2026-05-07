/* ==========================================
   Table Data Store
========================================== */
const tableData = [
  {
    key:      'table1',
    name:     'Table 1',
    title:    'Intimate Duo Table',
    subtitle: 'Ground Floor · Cozy Corner',
    image:    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=900&q=80',
    desc:     'A snug two-seater tucked in a warm corner, perfect for an intimate dinner for two. Soft candlelight and a quiet ambiance make this table ideal for date nights or private conversations.',
    capacity: 2,
    floor:    'GF',
    rating:   '★ 4.7',
    setting:  'Corner',
    pills: [
      { icon: 'fas fa-heart',      label: 'Romantic'       },
      { icon: 'fas fa-users',      label: '2 Seats'        },
      { icon: 'fas fa-moon',       label: 'Candlelit'      },
      { icon: 'fas fa-volume-mute',label: 'Quiet Zone'     },
    ],
  },
  {
    key:      'table2',
    name:     'Table 2',
    title:    'Garden View Table',
    subtitle: 'Ground Floor · Garden Side',
    image:    'https://images.unsplash.com/photo-1592861956120-e524fc739696?w=900&q=80',
    desc:     'Beside a large glass panel overlooking our lush herb garden, Table 2 floods with natural light during the day and warm ambient glow at night. A favourite for brunch and relaxed lunches.',
    capacity: 2,
    floor:    'GF',
    rating:   '★ 4.6',
    setting:  'Garden Side',
    pills: [
      { icon: 'fas fa-seedling',   label: 'Garden View'    },
      { icon: 'fas fa-users',      label: '2 Seats'        },
      { icon: 'fas fa-sun',        label: 'Natural Light'  },
      { icon: 'fas fa-coffee',     label: 'Brunch Favourite'},
    ],
  },
  {
    key:      'table3',
    name:     'Table 3',
    title:    'Classic Centre Table',
    subtitle: 'Ground Floor · Main Dining',
    image:    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=900&q=80',
    desc:     'Sitting at the heart of the main dining room, Table 3 gives guests the full atmosphere of Feliciano — the hum of conversation, the aroma of the kitchen, and an unobstructed view of the entire floor.',
    capacity: 4,
    floor:    'GF',
    rating:   '★ 4.8',
    setting:  'Main Hall',
    pills: [
      { icon: 'fas fa-star',       label: 'Most Popular'   },
      { icon: 'fas fa-users',      label: '4 Seats'        },
      { icon: 'fas fa-utensils',   label: 'Kitchen View'   },
      { icon: 'fas fa-globe',      label: 'Full Atmosphere'},
    ],
  },
  {
    key:      'table4',
    name:     'Table 4',
    title:    'Bay Window Booth',
    subtitle: 'Ground Floor · Street Side',
    image:    'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=900&q=80',
    desc:     'A cosy booth framed by a wide bay window facing the street. Upholstered bench seating and a private feel make it a go-to for small family gatherings or a relaxed group meal.',
    capacity: 4,
    floor:    'GF',
    rating:   '★ 4.7',
    setting:  'Booth',
    pills: [
      { icon: 'fas fa-eye',        label: 'Street View'    },
      { icon: 'fas fa-users',      label: '4 Seats'        },
      { icon: 'fas fa-couch',      label: 'Booth Seating'  },
      { icon: 'fas fa-child',      label: 'Family Friendly'},
    ],
  },
  {
    key:      'table5',
    name:     'Table 5',
    title:    'Signature Window Table',
    subtitle: 'Ground Floor · Panoramic View',
    image:    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=80',
    desc:     'Positioned at the heart of our dining floor, Table 5 offers a sweeping panoramic view through floor-to-ceiling windows overlooking the garden courtyard. Upholstered in warm cognac leather with soft overhead pendant lighting, it creates an intimate yet airy atmosphere. Ideal for romantic evenings, business dinners, or small celebrations.',
    capacity: 4,
    floor:    'GF',
    rating:   '★ 4.9',
    setting:  'Indoor',
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
    desc:     'Set on our open-air terrace on the first floor, Table 6 is a round six-seater with a beautiful city skyline backdrop. Ideal for evening gatherings, celebrations, or anyone who loves fresh air with their fine dining.',
    capacity: 6,
    floor:    'F1',
    rating:   '★ 4.8',
    setting:  'Outdoor',
    pills: [
      { icon: 'fas fa-cloud-sun',  label: 'Open Air'       },
      { icon: 'fas fa-users',      label: '6 Seats'        },
      { icon: 'fas fa-city',       label: 'Skyline View'   },
      { icon: 'fas fa-glass-cheers',label: 'Events Friendly'},
    ],
  },
  {
    key:      'table7',
    name:     'Table 7',
    title:    'Private Corner Alcove',
    subtitle: 'Mezzanine Level · Quiet Corner',
    image:    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80',
    desc:     'Tucked into a quiet alcove on our mezzanine level, Table 7 is our most requested table for couples and intimate groups seeking privacy. Framed by arched brickwork and soft wall-mounted sconces, the space radiates warmth and character. A curated wine shelf lines the adjacent wall, setting the scene for an unforgettable dining experience.',
    capacity: 6,
    floor:    'M1',
    rating:   '★ 4.8',
    setting:  'Alcove',
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
    desc:     'Our largest table, housed in a semi-private dining room on the first floor. Perfect for corporate events, large family celebrations, or group dinners. A dedicated server is assigned to Table 8 reservations.',
    capacity: 8,
    floor:    'F1',
    rating:   '★ 5.0',
    setting:  'Private Room',
    pills: [
      { icon: 'fas fa-crown',      label: 'Premium Table'  },
      { icon: 'fas fa-users',      label: '8 Seats'        },
      { icon: 'fas fa-concierge-bell', label: 'Dedicated Server'},
      { icon: 'fas fa-door-closed',label: 'Semi-Private'   },
    ],
  },
];

/* ==========================================
   Lookup by key (for reservation cards)
========================================== */
function getTableByKey(key) {
  return tableData.find(t => t.key === key) || null;
}

/* ==========================================
   STEP 1 — Book a Table → Table Browser Modal
   Shows all tables with image + description
========================================== */
function openBookingBrowser() {
  const grid = document.getElementById('tableBrowserGrid');
  grid.innerHTML = tableData.map(t => `
    <div class="browser-card" onclick="openTablePreview('${t.key}')">
      <div class="browser-card-img-wrap">
        <img src="${t.image}" alt="${t.name}" loading="lazy"/>
        <span class="browser-card-badge">${t.name}</span>
        <span class="browser-card-cap"><i class="fas fa-users"></i> ${t.capacity} seats</span>
      </div>
      <div class="browser-card-body">
        <div class="browser-card-title">${t.title}</div>
        <div class="browser-card-subtitle">${t.subtitle}</div>
        <p class="browser-card-desc">${t.desc}</p>
        <div class="browser-card-pills">
          ${t.pills.slice(0,3).map(p => `<span class="pill"><i class="${p.icon}"></i>${p.label}</span>`).join('')}
        </div>
        <button class="browser-select-btn" onclick="event.stopPropagation(); selectAndBook('${t.key}')">
          <i class="fas fa-calendar-plus"></i> Reserve This Table
        </button>
      </div>
    </div>
  `).join('');

  openModal('tableBrowserOverlay');
}

/* ==========================================
   STEP 2 — Quick Preview inside Browser
   (full detail for a table before confirming)
========================================== */
function openTablePreview(tableKey) {
  const t = getTableByKey(tableKey);
  if (!t) return;
  populateDetailModal(t);
  // Override the CTA to go to booking form with this table
  document.getElementById('detailReserveBtn').onclick = () => {
    closeModal('tableDetailOverlay');
    closeModal('tableBrowserOverlay');
    openBookingForm(tableKey);
  };
  openModal('tableDetailOverlay');
}

/* ==========================================
   STEP 3 — Booking Form (table pre-selected)
========================================== */
function selectAndBook(tableKey) {
  closeModal('tableBrowserOverlay');
  openBookingForm(tableKey);
}

function openBookingForm(tableKey) {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookDate').value = today;

  // Pre-select the right chip
  document.querySelectorAll('.table-chip').forEach(c => {
    c.classList.toggle('selected', c.dataset.table === tableKey.replace('table',''));
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
   Capacity Warning Logic
========================================== */
const tableCapacities = { 1:2, 2:2, 3:4, 4:4, 5:4, 6:6, 7:6, 8:8 };

function getSelectedGuests() {
  const val = document.getElementById('bookGuests').value;
  // "7–8 guests (large table)" → treat as 8
  if (val.startsWith('7')) return 8;
  return parseInt(val) || 1;
}

function checkCapacity() {
  const selectedChip = document.querySelector('.table-chip.selected');
  const warning      = document.getElementById('capacityWarning');
  const msgEl        = document.getElementById('capacityWarningMsg');
  const submitBtn    = document.getElementById('bookingSubmitBtn');

  if (!selectedChip) { warning.classList.remove('show'); return; }

  const tableNum  = parseInt(selectedChip.dataset.table);
  const capacity  = tableCapacities[tableNum];
  const guests    = getSelectedGuests();

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

// Re-check whenever guest count changes
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('bookGuests').addEventListener('change', checkCapacity);
});

function submitBooking() {
  closeModal('bookingOverlay');
  showToast("Reservation request sent! We'll confirm shortly.");
}

/* ==========================================
   View Table Details — Reservation Cards
   (user views details of their booked table)
========================================== */
function viewReservationTable(tableKey) {
  const t = getTableByKey(tableKey);
  if (!t) return;
  populateDetailModal(t);
  // CTA from reservation context: just close
  document.getElementById('detailReserveBtn').onclick = () => closeModal('tableDetailOverlay');
  document.getElementById('detailReserveBtn').innerHTML = '<i class="fas fa-times"></i> Close';
  openModal('tableDetailOverlay');
}

/* ==========================================
   Shared — populate the detail modal
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

  // Reset CTA label
  document.getElementById('detailReserveBtn').innerHTML = '<i class="fas fa-calendar-plus"></i> Reserve This Table';
}

/* ==========================================
   Shared Modal Helpers
========================================== */
function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function handleOverlayClick(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['tableDetailOverlay','tableBrowserOverlay','bookingOverlay'].forEach(closeModal);
  }
});

/* ==========================================
   Toast Notification
========================================== */
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3800);
}