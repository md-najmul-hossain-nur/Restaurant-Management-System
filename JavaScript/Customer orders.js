/**
 * order.js
 * Handles the public order form on order.html
 * Option C: linked to account if logged in, guest order if not
 */

document.addEventListener('DOMContentLoaded', async () => {

  const form         = document.getElementById('orderForm');
  const itemSelect   = document.getElementById('orderItem');
  const addItemBtn   = document.getElementById('addItemBtn');
  const itemsList    = document.getElementById('itemsList');
  const submitBtn    = document.getElementById('submitOrderBtn');
  const toast        = document.getElementById('orderToast');
  const toastMsg     = document.getElementById('toastMsg');
  const guestFields  = document.getElementById('guestFields');

  let menuItems = [];
  let selectedItems = []; // { recipe_id, name, price, quantity }

  function getPreselectedItem() {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('item');
    const price = parseFloat(params.get('price') || '');

    if (!name || Number.isNaN(price)) return null;
    return { name, price };
  }

  function addSelectedItem(item) {
    if (!item || !item.name || Number.isNaN(parseFloat(item.price))) return;

    const id = item.recipe_id ? parseInt(item.recipe_id) : null;
    const price = parseFloat(item.price);
    const existing = selectedItems.find(i =>
      (id && i.recipe_id === id) || (!id && i.name.toLowerCase() === item.name.toLowerCase())
    );

    if (existing) {
      existing.quantity++;
    } else {
      selectedItems.push({ recipe_id: id, name: item.name, price, quantity: 1 });
    }
  }

  // ── Check if logged in ─────────────────────────────────
  async function checkLogin() {
    try {
      const res = await fetch('../api/profile.php');
      if (res.status === 401) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  }

  // ── Load menu items from DB ────────────────────────────
  async function loadMenuItems() {
    try {
      const res   = await fetch('../api/get_menu.php');
      if (!res.ok) throw new Error('Failed to load menu');
      menuItems   = await res.json();

      itemSelect.innerHTML = '<option value="">— Select an item —</option>';
      menuItems.forEach(item => {
        const opt   = document.createElement('option');
        opt.value   = item.id;
        opt.dataset.name  = item.name;
        opt.dataset.price = item.price;
        opt.textContent   = `${item.name} — $${parseFloat(item.price).toFixed(2)}`;
        itemSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      itemSelect.innerHTML = '<option>Could not load menu</option>';
    }
  }

  // ── Load tables from DB ────────────────────────────
  async function loadTables() {
    const tableSelect = document.getElementById('orderTable');
    if (!tableSelect) return;

    try {
      const res = await fetch('../api/get_tables.php');
      if (!res.ok) throw new Error('Failed to load tables');
      const tables = await res.json();

      tableSelect.innerHTML = '<option value="">— No table / Takeaway —</option>';
      tables.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `Table ${t.table_number} (${t.capacity} seats) — ${t.status}`;
        if (t.status === 'occupied') opt.disabled = true;
        tableSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      tableSelect.innerHTML = '<option value="">Could not load tables</option>';
    }
  }

  // ── Render selected items list ─────────────────────────
  function renderItems() {
    itemsList.innerHTML = '';
    if (selectedItems.length === 0) {
      itemsList.innerHTML = '<p class="no-items">No items added yet.</p>';
      return;
    }

    selectedItems.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'selected-item-row';
      div.innerHTML = `
        <span class="sel-name">${item.name}</span>
        <div class="sel-controls">
          <button type="button" class="qty-btn" data-action="minus" data-index="${index}">−</button>
          <span class="sel-qty">${item.quantity}</span>
          <button type="button" class="qty-btn" data-action="plus" data-index="${index}">+</button>
        </div>
        <span class="sel-price">$${(item.price * item.quantity).toFixed(2)}</span>
        <button type="button" class="remove-btn" data-index="${index}"><i class="fas fa-times"></i></button>
      `;
      itemsList.appendChild(div);
    });

    // Total
    const total = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const totalDiv = document.createElement('div');
    totalDiv.className = 'items-total';
    totalDiv.innerHTML = `<span>Subtotal</span><span>$${total.toFixed(2)}</span>`;
    itemsList.appendChild(totalDiv);
  }

  // ── Add item button ────────────────────────────────────
  addItemBtn.addEventListener('click', () => {
    const selected = itemSelect.options[itemSelect.selectedIndex];
    if (!selected || !selected.value) {
      showToast('Please select an item first.', true);
      return;
    }

    const id    = parseInt(selected.value);
    const name  = selected.dataset.name;
    const price = parseFloat(selected.dataset.price);

    addSelectedItem({ recipe_id: id, name, price });

    itemSelect.selectedIndex = 0;
    renderItems();
  });

  // ── Qty / remove buttons (delegated) ──────────────────
  itemsList.addEventListener('click', (e) => {
    const qtyBtn    = e.target.closest('.qty-btn');
    const removeBtn = e.target.closest('.remove-btn');

    if (qtyBtn) {
      const index  = parseInt(qtyBtn.dataset.index);
      const action = qtyBtn.dataset.action;
      if (action === 'plus')  selectedItems[index].quantity++;
      if (action === 'minus') selectedItems[index].quantity--;
      if (selectedItems[index].quantity <= 0) selectedItems.splice(index, 1);
      renderItems();
    }

    if (removeBtn) {
      const index = parseInt(removeBtn.dataset.index);
      selectedItems.splice(index, 1);
      renderItems();
    }
  });

  // ── Toast ──────────────────────────────────────────────
  const backdrop = document.createElement('div');
  backdrop.className = 'toast-backdrop';
  document.body.appendChild(backdrop);
  let toastTimer = null;

  function showToast(msg, isError = false) {
    const icon = toast.querySelector('i');
    toastMsg.textContent = msg;
    icon.className = isError ? 'fas fa-times-circle' : 'fas fa-check-circle';
    icon.style.color   = isError ? '#c0392b' : '#c8a96a';
    toast.classList.add('show');
    backdrop.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      backdrop.classList.remove('show');
    }, 3000);
    backdrop.onclick = () => {
      toast.classList.remove('show');
      backdrop.classList.remove('show');
      clearTimeout(toastTimer);
    };
  }

  // ── Submit ─────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      showToast('Please add at least one item.', true);
      return;
    }

    const tableVal = document.getElementById('orderTable')?.value.trim();
    const notes    = document.getElementById('orderNotes')?.value.trim();

    // Guest fields (only sent if not logged in)
    const guestName  = document.getElementById('orderName')?.value.trim();
    const guestPhone = document.getElementById('orderPhone')?.value.trim();

    // Validate guest fields if shown
    if (guestFields && !guestFields.classList.contains('hidden')) {
      if (!guestName)  { showToast('Please enter your name.', true);  return; }
      if (!guestPhone) { showToast('Please enter your phone.', true); return; }
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Placing order…';

    try {
      const res = await fetch('../api/place_order.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_id:       tableVal ? parseInt(tableVal) : null,
          payment_method: 'Cash',
          guest_name:     guestName  || null,
          guest_phone:    guestPhone || null,
          notes:          notes      || null,
          items:          selectedItems.map(i => ({
            recipe_id: i.recipe_id,
            name:      i.name,
            price:     i.price,
            quantity:  i.quantity,
          })),
        }),
      });

      const result = await res.json();

      if (result.success) {
        showToast(`Order #${result.order_id} placed successfully!`);
        selectedItems = [];
        renderItems();
        form.reset();
      } else {
        showToast(result.error || 'Could not place order.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error. Please try again.', true);
    } finally {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Confirm Order';
    }
  });

  // ── Boot ───────────────────────────────────────────────
  const user = await checkLogin();

  if (user) {
    // Logged in — hide guest fields, show welcome
    if (guestFields) guestFields.classList.add('hidden');
    const welcomeEl = document.getElementById('loggedInNote');
    if (welcomeEl) { welcomeEl.classList.remove("hidden"); welcomeEl.textContent = `Ordering as: ${user.name}`; }
  } else {
    // Guest — show name + phone fields
    if (guestFields) guestFields.classList.remove('hidden');
    const welcomeEl = document.getElementById('loggedInNote');
    if (welcomeEl) {
      welcomeEl.classList.remove('hidden');
      welcomeEl.textContent = 'Ordering as guest';
    }

    // Guests can't choose tables (per user request)
    const tableContainer = document.getElementById('tableFieldContainer');
    if (tableContainer) tableContainer.classList.add('hidden');
  }

  // If customer or waiter, show and load tables
  if (user && (user.role === 'customer' || user.role === 'waiter')) {
    const tableContainer = document.getElementById('tableFieldContainer');
    if (tableContainer) {
      tableContainer.classList.remove('hidden');
      await loadTables();
    }
  }

  await loadMenuItems();
  const preselected = getPreselectedItem();
  if (preselected) {
    const matched = menuItems.find(item => item.name.toLowerCase() === preselected.name.toLowerCase());
    addSelectedItem({
      recipe_id: matched?.id || null,
      name: matched?.name || preselected.name,
      price: matched?.price || preselected.price,
    });
  }
  renderItems();
});
