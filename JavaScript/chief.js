// chief.js — Feliciano Chief Dashboard
// Covers: tab nav, clock out, recipe CRUD (DB-connected),
//         order mark-ready (DB-connected), profile modals

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
  function showToast(msg, isError = false) {
    const toast   = document.getElementById('successToast');
    const msgSpan = toast?.querySelector('.toast-msg');
    if (!toast) return;
    if (msgSpan) msgSpan.textContent = msg;
    toast.style.borderColor = isError ? 'rgba(224,85,85,.45)' : 'rgba(200,169,106,.45)';
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ── Recipe Modal ──────────────────────────────────────────
  const recipeModal    = document.getElementById('addRecipeModal');
  const recipeOpenBtn  = document.querySelector('[data-add-recipe]');
  const recipesGrid    = document.getElementById('recipesGrid');
  const addRecipeForm  = document.getElementById('addRecipeForm');
  const previewImg     = document.getElementById('recipeImagePreview');
  const imageFileInput = document.getElementById('recipeImageFile');

  let editingCard = null;

  function openRecipeModal() {
    if (!recipeModal) return;
    recipeModal.removeAttribute('inert');
    recipeModal.classList.add('open');
    recipeModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => document.getElementById('recipeName')?.focus(), 50);
  }

  function closeRecipeModal() {
    if (!recipeModal) return;
    recipeModal.classList.remove('open');
    recipeModal.setAttribute('aria-hidden', 'true');
    recipeModal.setAttribute('inert', '');
    editingCard = null;
    addRecipeForm?.reset();
    if (previewImg) { previewImg.src = ''; previewImg.hidden = true; }
    const heading = recipeModal.querySelector('.recipe-modal-heading');
    if (heading) heading.innerHTML = '<i class="fas fa-bowl-food"></i> Add Recipe';
    const submitBtn = recipeModal.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add Recipe';
  }

  recipeOpenBtn?.addEventListener('click', openRecipeModal);

  recipeModal?.querySelectorAll('[data-recipe-close]').forEach(el =>
    el.addEventListener('click', closeRecipeModal)
  );

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && recipeModal?.classList.contains('open')) closeRecipeModal();
  });

  // Image preview
  imageFileInput?.addEventListener('change', () => {
    const file = imageFileInput.files[0];
    if (!file || !previewImg) return;
    previewImg.src    = URL.createObjectURL(file);
    previewImg.hidden = false;
  });

  // ★ Edit button on existing recipe cards
  recipesGrid?.addEventListener('click', e => {
    const editBtn = e.target.closest('[data-edit-recipe]');
    if (!editBtn) return;
    const card = editBtn.closest('.recipe-card');
    if (!card) return;
    editingCard = card;

    const titleEl = card.querySelector('.card-title');
    const descEl  = card.querySelector('.recipe-desc');
    const priceEl = card.querySelector('.recipe-price');

    document.getElementById('recipeName').value    = titleEl?.textContent || '';
    document.getElementById('recipeDetails').value = (descEl?.textContent || '').replace('Details: ', '');
    document.getElementById('recipePrice').value   = parseFloat(priceEl?.textContent) || '';

    const heading = recipeModal.querySelector('.recipe-modal-heading');
    if (heading) heading.innerHTML = '<i class="fas fa-bowl-food"></i> Edit Recipe';
    const submitBtn = recipeModal.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Update Recipe';

    openRecipeModal();
  });

  // ★ Form submit → save to DB (new) or update DOM (edit)
  if (addRecipeForm) {
    addRecipeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = addRecipeForm.querySelector('[type="submit"]');
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Saving…';

      if (editingCard) {
        // Edit: update DOM only (no dedicated update API yet — add one if needed)
        const name  = document.getElementById('recipeName').value.trim();
        const desc  = document.getElementById('recipeDetails').value.trim();
        const price = document.getElementById('recipePrice').value;

        editingCard.querySelector('.card-title').textContent      = name;
        editingCard.querySelector('.recipe-desc').textContent     = 'Details: ' + desc;
        editingCard.querySelector('.recipe-price').textContent    = '$' + parseFloat(price).toFixed(2);
        closeRecipeModal();
        showToast('Recipe updated!');
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Update Recipe';
        return;
      }

      // New recipe → send to DB
      try {
        const formData = new FormData(addRecipeForm);
        const res      = await fetch('../api/add_recipe.php', { method: 'POST', body: formData });
        const result   = await res.json();

        if (result.success) {
          // Add new card to grid
          const name    = document.getElementById('recipeName').value.trim();
          const desc    = document.getElementById('recipeDetails').value.trim();
          const price   = parseFloat(document.getElementById('recipePrice').value).toFixed(2);
          const imgSrc  = previewImg && !previewImg.hidden ? previewImg.src : '../Images/food/default.png';

          const article = document.createElement('article');
          article.className = 'card order-card recipe-card grid-6';
          article.dataset.recipeId = result.recipe_id;
          article.innerHTML = `
            <span class="status-badge corner-badge">Pending</span>
            <img class="order-image" src="${imgSrc}" alt="${name}" />
            <div class="order-body">
              <div class="card-head">
                <div>
                  <h3 class="card-title">${name}</h3>
                  <p class="card-subtitle">Newly added</p>
                </div>
              </div>
              <p class="recipe-desc">Details: ${desc}</p>
              <div class="divider"></div>
              <div class="actions recipe-actions">
                <span class="pill recipe-price">$${price}</span>
                <button class="order-edit-btn" data-edit-recipe>Edit</button>
              </div>
            </div>`;
          recipesGrid.appendChild(article);
          closeRecipeModal();
          showToast('Recipe submitted for approval!');
        } else {
          showToast(result.error || 'Failed to add recipe', true);
        }
      } catch (err) {
        console.error(err);
        showToast('Network error. Try again.', true);
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Add Recipe';
      }
    });
  }

  // ── Load recipes from DB on page load ─────────────────────
  async function loadRecipes() {
    if (!recipesGrid) return;
    try {
      const res     = await fetch('../api/get_chef_recipes.php');
      if (!res.ok) return; // silently fall back to hardcoded HTML cards
      const recipes = await res.json();
      if (!recipes.length) return;

      recipesGrid.innerHTML = '';
      recipes.forEach(r => {
        const article = document.createElement('article');
        article.className    = 'card order-card recipe-card grid-6';
        article.dataset.recipeId = r.id;
        article.innerHTML = `
          <span class="status-badge corner-badge">${capitalize(r.status)}</span>
          <img class="order-image" src="${r.image_path || '../Images/food/default.png'}" alt="${r.name}" />
          <div class="order-body">
            <div class="card-head">
              <div>
                <h3 class="card-title">${r.name}</h3>
                <p class="card-subtitle">${r.status === 'approved' ? 'Live on menu' : 'Awaiting approval'}</p>
              </div>
            </div>
            <p class="recipe-desc">Details: ${r.description || ''}</p>
            <div class="divider"></div>
            <div class="actions recipe-actions">
              <span class="pill recipe-price">$${parseFloat(r.price).toFixed(2)}</span>
              <button class="order-edit-btn" data-edit-recipe>Edit</button>
            </div>
          </div>`;
        recipesGrid.appendChild(article);
      });
    } catch {}
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  loadRecipes();

  // ── Order Mark Ready ─────────────────────────────────────
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
            body:    JSON.stringify({ order_id: parseInt(orderId), status: 'ready' }),
          });
        } catch {}
      }
      statusEl.textContent  = 'Ready';
      actionBtn.textContent = '✓ Ready';
      actionBtn.disabled    = true;
      setTimeout(() => { actionBtn.hidden = true; }, 400);
      showToast('Order marked as ready!');
    });
  });

  // ── Profile Modals (identical to waiter) ─────────────────
  const overlays = {
    settings:    document.getElementById('settingsOverlay'),
    editProfile: document.getElementById('editProfileOverlay'),
    editPassword: document.getElementById('editPasswordOverlay'),
  };

  function openOverlay(key)  { overlays[key]?.classList.add('active');    }
  function closeOverlay(key) { overlays[key]?.classList.remove('active'); }

  document.getElementById('openSettingsBtn')?.addEventListener('click', () => openOverlay('settings'));
  document.getElementById('closeSettings')?.addEventListener('click',   () => closeOverlay('settings'));
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

  // Load profile from DB
  async function loadProfile() {
    try {
      const res  = await fetch('../api/profile.php');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.user) return;
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('displayName',  data.user.name);
      set('displayEmail', data.user.email);
      // Pre-fill form
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
      } else {
        showToast(result.error || 'Failed', true);
      }
    } catch { showToast('Network error.', true); }
  });

  // Change password
  document.getElementById('savePassword')?.addEventListener('click', async () => {
    const cur  = document.getElementById('inputCurrentPwd')?.value;
    const newP = document.getElementById('inputNewPwd')?.value;
    const conf = document.getElementById('inputConfirmPwd')?.value;
    if (!cur || !newP || !conf) return;
    if (newP.length < 8)   { showToast('Password must be at least 8 characters', true); return; }
    if (newP !== conf)      { showToast('Passwords do not match', true); return; }

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
      } else {
        showToast(result.error || 'Failed', true);
      }
    } catch { showToast('Network error.', true); }
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