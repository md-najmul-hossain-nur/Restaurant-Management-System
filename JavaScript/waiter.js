document.addEventListener('DOMContentLoaded', () => {

  // Add Recipe (Chief dashboard)
  const recipeModal = document.getElementById('addRecipeModal');
  const recipeOpenBtn = document.querySelector('[data-add-recipe]');
  const recipesGrid = document.getElementById('recipesGrid');

  // Order delivery logic (only deliver Ready orders)
  /* ============================================================
     1. TAB / SECTION NAVIGATION  (was completely missing)
  ============================================================ */
  const tabs = document.querySelectorAll('.tab[data-section]');
  const sections = document.querySelectorAll('.section-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // When clocked out (Clock In mode), keep tabs visible but disabled.
      if (document.body.classList.contains('is-clocked-out')) return;
      const target = tab.dataset.section;

      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      const targetSection = document.getElementById(target);
      if (targetSection) targetSection.classList.add('active');
    });
  });


  /* ============================================================
     2. CLOCK OUT BUTTON
  ============================================================ */
  // Clock Out / Clock In is handled in-page by admin.js.


  /* ============================================================
     3. TABLES — Take / Release logic
  ============================================================ */
  const myTablesGrid   = document.getElementById('myTablesGrid');
  const availTablesGrid = document.getElementById('availTablesGrid');
  const myTableCount   = document.getElementById('myTableCount');
  const availTableCount = document.getElementById('availTableCount');

  const updateTableCounts = () => {
    if (myTableCount)   myTableCount.textContent   = myTablesGrid   ? myTablesGrid.querySelectorAll('.waiter-table-card').length   : 0;
    if (availTableCount) availTableCount.textContent = availTablesGrid ? availTablesGrid.querySelectorAll('.waiter-table-card').length : 0;
  };

  if (myTablesGrid) {
    myTablesGrid.addEventListener('click', e => {
      const releaseBtn = e.target.closest('[data-release]');
      if (!releaseBtn || !availTablesGrid) return;

      const card = releaseBtn.closest('.waiter-table-card');
      if (!card) return;

      // Swap button to "Take Table"
      releaseBtn.classList.remove('waiter-table-action--release');
      releaseBtn.classList.add('waiter-table-action--take');
      releaseBtn.textContent = 'Take Table';
      const tableId = releaseBtn.dataset.release;
      releaseBtn.removeAttribute('data-release');
      releaseBtn.setAttribute('data-take', tableId);

      availTablesGrid.appendChild(card);
      updateTableCounts();
    });
  }

  if (availTablesGrid) {
    availTablesGrid.addEventListener('click', e => {
      const takeBtn = e.target.closest('[data-take]');
      if (!takeBtn || !myTablesGrid) return;

      const card = takeBtn.closest('.waiter-table-card');
      if (!card) return;

      // Swap button to "Release Table"
      takeBtn.classList.remove('waiter-table-action--take');
      takeBtn.classList.add('waiter-table-action--release');
      takeBtn.textContent = 'Release Table';
      const tableId = takeBtn.dataset.take;
      takeBtn.removeAttribute('data-take');
      takeBtn.setAttribute('data-release', tableId);

      myTablesGrid.appendChild(card);
      updateTableCounts();
    });
  }


  /* ============================================================
     4. ORDERS — Deliver logic + stat counters
  ============================================================ */
  const orderSection = document.getElementById('order');
  const orderList    = orderSection ? orderSection.querySelector('.order-list') : null;
  const orderCountEl = document.getElementById('orderCount');

  const statPending   = document.getElementById('statPending');
  const statProgress  = document.getElementById('statProgress');
  const statCompleted = document.getElementById('statCompleted');

  const updateOrderStats = () => {
    if (!orderList) return;
    const cards     = orderList.querySelectorAll('.order-card');
    const pending   = orderList.querySelectorAll('.order-status--ready').length;
    const inKitchen = orderList.querySelectorAll('.order-status--kitchen').length;

    if (orderCountEl)  orderCountEl.textContent  = cards.length;
    if (statPending)   statPending.textContent    = pending;
    if (statProgress)  statProgress.textContent   = inKitchen;
  };

  // Run once on load
  updateOrderStats();

  if (orderList) {
    orderList.addEventListener('click', e => {
      const deliverBtn = e.target.closest('[data-deliver-order]');
      if (!deliverBtn) return;

      const card     = deliverBtn.closest('.order-card');
      const statusEl = card ? card.querySelector('.order-status') : null;
      if (!statusEl) return;

      const isReady = statusEl.classList.contains('order-status--ready');
      if (!isReady) {
        // Visual feedback — shake the status badge
        statusEl.style.outline = '2px solid rgba(224,115,59,0.8)';
        setTimeout(() => statusEl.style.outline = '', 1000);
        return;
      }

      statusEl.classList.remove('order-status--ready', 'order-status--kitchen');
      statusEl.classList.add('order-status--delivered');
      statusEl.textContent = 'Delivered';
      deliverBtn.remove();

      // Increment completed stat
      if (statCompleted) statCompleted.textContent = (parseInt(statCompleted.textContent) || 0) + 1;
      updateOrderStats();
    });
  }


  /* ============================================================
     5. NEW ORDER MODAL
  ============================================================ */
  const modal   = document.getElementById('newOrderModal');
  const openBtn = document.querySelector('[data-new-order]');

  if (modal && openBtn) {
    const closeEls          = modal.querySelectorAll('[data-order-close]');
    const placeBtn          = modal.querySelector('[data-order-place]');
    const itemButtons       = modal.querySelectorAll('[data-menu-item]');
    const selectedItemsList = document.getElementById('selectedItemsList');
    const selectedItemsTotal = document.getElementById('selectedItemsTotal');

    const selectedItems = new Map();

    const EMPTY_PLACEHOLDER = '<span style="color:rgba(254,254,255,0.45);font-style:italic">No items selected</span>';

    const formatMoney = amount => `$${(Number.isFinite(amount) ? amount : 0).toFixed(2)}`;

    const updateSelectedUI = () => {
      if (!selectedItemsList) return;

      if (selectedItems.size === 0) {
        selectedItemsList.innerHTML = EMPTY_PLACEHOLDER;   // ← restored placeholder
        if (selectedItemsTotal) selectedItemsTotal.textContent = formatMoney(0);
        return;
      }

      selectedItemsList.innerHTML = '';
      let total = 0;

      for (const [name, { qty, price }] of selectedItems.entries()) {
        total += qty * price;
        const row = document.createElement('div');
        row.className = 'order-selected-row';

        // Remove button per item
        row.innerHTML = `
          <span>${qty} × ${name}</span>
          <span class="order-selected-item-price">${formatMoney(qty * price)}</span>
          <button class="order-selected-remove" data-remove="${name}" aria-label="Remove ${name}">×</button>
        `;
        selectedItemsList.appendChild(row);
      }

      if (selectedItemsTotal) selectedItemsTotal.textContent = formatMoney(total);
    };

    // Remove individual items
    selectedItemsList && selectedItemsList.addEventListener('click', e => {
      const removeBtn = e.target.closest('[data-remove]');
      if (!removeBtn) return;
      selectedItems.delete(removeBtn.dataset.remove);
      updateSelectedUI();
    });

    const openModal = () => {
      modal.removeAttribute('inert');
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      const select = document.getElementById('orderTableSelect');
      if (select) setTimeout(() => { try { select.focus(); } catch {} }, 50);
    };

    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('inert', '');
      if (modal.contains(document.activeElement)) {
        try { openBtn.focus(); } catch {}
      }
      selectedItems.clear();
      updateSelectedUI();
    };

    openBtn.addEventListener('click', openModal);
    closeEls.forEach(el => el.addEventListener('click', closeModal));

    if (placeBtn) {
      placeBtn.addEventListener('click', () => {
        const select = document.getElementById('orderTableSelect');
        if (!select || !select.value) {
          select && (select.style.outline = '2px solid rgba(224,115,59,0.8)');
          setTimeout(() => select && (select.style.outline = ''), 1200);
          return;
        }
        if (selectedItems.size === 0) {
          if (selectedItemsTotal) {
            selectedItemsTotal.style.color = 'rgba(224,115,59,0.9)';
            setTimeout(() => selectedItemsTotal.style.color = '', 1200);
          }
          return;
        }
        // Order placed — close modal and show success
        closeModal();
        const toast = document.getElementById('successToast');
        if (toast) {
          toast.classList.add('show');
          setTimeout(() => {
            toast.classList.remove('show');
          }, 1800);
        }
      });
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    itemButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const name  = btn.getAttribute('data-name')  || 'Item';
        const price = parseFloat(btn.getAttribute('data-price')) || 0;
        const existing = selectedItems.get(name);
        selectedItems.set(name, existing
          ? { qty: existing.qty + 1, price: existing.price }
          : { qty: 1, price: Number.isFinite(price) ? price : 0 }
        );
        updateSelectedUI();
      });
    });

    updateSelectedUI();
  }

  // Add Recipe modal logic
  if (recipeModal && recipeOpenBtn && recipesGrid) {
    const closeEls = recipeModal.querySelectorAll('[data-recipe-close]');
    const form = document.getElementById('addRecipeForm');
    const nameInput = document.getElementById('recipeName');
    const detailsInput = document.getElementById('recipeDetails');
    const priceInput = document.getElementById('recipePrice');
    const statusSelect = document.getElementById('recipeStatus');
    const imagePathSelect = document.getElementById('recipeImagePath');
    const imageFileInput = document.getElementById('recipeImageFile');
    const preview = document.getElementById('recipeImagePreview');

    let previewObjectUrl = null;

    const setPreview = (src) => {
      if (!preview) return;

      if (!src) {
        preview.hidden = true;
        preview.removeAttribute('src');
        return;
      }

      preview.src = src;
      preview.hidden = false;
    };

    const clearPreviewObjectUrl = () => {
      if (previewObjectUrl) {
        try {
          URL.revokeObjectURL(previewObjectUrl);
        } catch {
          // ignore
        }
        previewObjectUrl = null;
      }
    };

    const openRecipeModal = () => {
      recipeModal.removeAttribute('inert');
      recipeModal.classList.add('active');
      recipeModal.setAttribute('aria-hidden', 'false');

      setTimeout(() => {
        try {
          if (nameInput) nameInput.focus();
        } catch {
          // ignore
        }
      }, 0);
    };

    const closeRecipeModal = () => {
      recipeModal.classList.remove('active');
      recipeModal.setAttribute('aria-hidden', 'true');
      recipeModal.setAttribute('inert', '');

      clearPreviewObjectUrl();
      setPreview('');

      if (form) {
        try {
          form.reset();
        } catch {
          // ignore
        }
      }

      if (recipeModal.contains(document.activeElement)) {
        try {
          recipeOpenBtn.focus();
        } catch {
          // ignore
        }
      }
    };

    recipeOpenBtn.addEventListener('click', openRecipeModal);

    closeEls.forEach((el) => {
      el.addEventListener('click', closeRecipeModal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && recipeModal.classList.contains('active')) {
        closeRecipeModal();
      }
    });

    if (imageFileInput) {
      imageFileInput.addEventListener('change', () => {
        clearPreviewObjectUrl();
        const file = imageFileInput.files && imageFileInput.files[0] ? imageFileInput.files[0] : null;
        if (file) {
          previewObjectUrl = URL.createObjectURL(file);
          setPreview(previewObjectUrl);
        } else if (imagePathSelect && imagePathSelect.value) {
          setPreview(imagePathSelect.value);
        } else {
          setPreview('');
        }
      });
    }

    if (imagePathSelect) {
      imagePathSelect.addEventListener('change', () => {
        const hasFile = imageFileInput && imageFileInput.files && imageFileInput.files.length > 0;
        if (hasFile) return;
        setPreview(imagePathSelect.value || '');
      });
    }

    const formatMoney = (amount) => {
      const safe = Number.isFinite(amount) ? amount : 0;
      return `$${safe.toFixed(2)}`;
    };

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = (nameInput && nameInput.value ? nameInput.value : '').trim() || 'New Recipe';
        const detailsRaw = (detailsInput && detailsInput.value ? detailsInput.value : '').trim() || 'Details not provided.';
        const details = detailsRaw.replace(/^details:\s*/i, '');
        const price = Number(priceInput && priceInput.value ? priceInput.value : 0);
        const status = (statusSelect && statusSelect.value ? statusSelect.value : 'Pending').trim() || 'Pending';

        let imgSrc = '';
        const file = imageFileInput && imageFileInput.files && imageFileInput.files[0] ? imageFileInput.files[0] : null;
        if (file) {
          clearPreviewObjectUrl();
          previewObjectUrl = URL.createObjectURL(file);
          imgSrc = previewObjectUrl;
        } else if (imagePathSelect && imagePathSelect.value) {
          imgSrc = imagePathSelect.value;
        } else {
          imgSrc = '../Images/food/hello.jpg';
        }

        const article = document.createElement('article');
        article.className = 'card order-card recipe-card grid-6';

        const badge = document.createElement('span');
        badge.className = 'status-badge corner-badge';
        badge.textContent = status;

        const img = document.createElement('img');
        img.className = 'order-image';
        img.src = imgSrc;
        img.alt = name;

        const body = document.createElement('div');
        body.className = 'order-body';

        const head = document.createElement('div');
        head.className = 'card-head';

        const headInner = document.createElement('div');

        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = name;

        const subtitle = document.createElement('p');
        subtitle.className = 'card-subtitle';
        subtitle.textContent = 'Chef added recipe';

        headInner.appendChild(title);
        headInner.appendChild(subtitle);
        head.appendChild(headInner);

        const desc = document.createElement('p');
        desc.className = 'recipe-desc';
        desc.textContent = `Details: ${details}`;

        const divider = document.createElement('div');
        divider.className = 'divider';

        const actions = document.createElement('div');
        actions.className = 'actions recipe-actions';

        const pricePill = document.createElement('span');
        pricePill.className = 'pill recipe-price';
        pricePill.textContent = formatMoney(price);

        actions.appendChild(pricePill);

        body.appendChild(head);
        body.appendChild(desc);
        body.appendChild(divider);
        body.appendChild(actions);

        article.appendChild(badge);
        article.appendChild(img);
        article.appendChild(body);

        recipesGrid.prepend(article);

        closeRecipeModal();
      });
    }
  }

  // Profile settings popover + modals
  const settingsBtn = document.querySelector('[data-profile-settings]');
  const popover = document.getElementById('profileSettingsPopover');
  const editProfileBtn = document.querySelector('[data-open-edit-profile]');
  const passwordBtn = document.querySelector('[data-open-password]');
  const editProfileModal = document.getElementById('editProfileModal');
  const changePasswordModal = document.getElementById('changePasswordModal');

  const openPopover = () => {
    if (!popover) return;
    popover.removeAttribute('inert');
    popover.classList.add('active');
    popover.setAttribute('aria-hidden', 'false');
    const first = popover.querySelector('button');
    if (first) setTimeout(() => { try { first.focus(); } catch {} }, 50);
  };

  const closePopover = () => {
    if (!popover) return;
    popover.classList.remove('active');
    popover.setAttribute('aria-hidden', 'true');
    popover.setAttribute('inert', '');
    if (popover.contains(document.activeElement) && settingsBtn) {
      try { settingsBtn.focus(); } catch {}
    }
  };

  if (settingsBtn && popover) {
    settingsBtn.addEventListener('click', () => {
      popover.classList.contains('active') ? closePopover() : openPopover();
    });

    document.addEventListener('click', e => {
      if (!popover.classList.contains('active')) return;
      if (!popover.contains(e.target) && !settingsBtn.contains(e.target)) closePopover();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && popover.classList.contains('active')) closePopover();
    });
  }


  /* ============================================================
     7. PROFILE MODALS — open / close
  ============================================================ */
  const openProfileModal = (targetModal, focusId) => {
    if (!targetModal) return;
    closePopover();
    targetModal.removeAttribute('inert');          // ← was missing
    targetModal.classList.add('active');
    targetModal.setAttribute('aria-hidden', 'false');
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) setTimeout(() => { try { el.focus(); } catch {} }, 50);
    }
  };

  const closeProfileModal = targetModal => {
    if (!targetModal) return;
    targetModal.classList.remove('active');
    targetModal.setAttribute('aria-hidden', 'true');
    targetModal.setAttribute('inert', '');         // ← lock it back
    try { settingsBtn && settingsBtn.focus(); } catch {}
  };

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => openProfileModal(editProfileModal, 'profileFullName'));
  }

  if (passwordBtn) {
    passwordBtn.addEventListener('click', () => openProfileModal(changePasswordModal, 'currentPassword'));
  }

  // Close buttons — unified selector covering both button types in modals
  document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      closeProfileModal(editProfileModal);
      closeProfileModal(changePasswordModal);
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (editProfileModal    && editProfileModal.classList.contains('active'))    closeProfileModal(editProfileModal);
      if (changePasswordModal && changePasswordModal.classList.contains('active')) closeProfileModal(changePasswordModal);
    }
  });

  // Close on backdrop click
  [editProfileModal, changePasswordModal].forEach(m => {
    if (!m) return;
    m.addEventListener('click', e => {
      if (e.target === m) closeProfileModal(m);
    });
  });


  /* ============================================================
     8. EDIT PROFILE — save & reflect changes in the card
  ============================================================ */
  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', e => {
      e.preventDefault();
      const name     = document.getElementById('profileFullName')?.value.trim();
      const email    = document.getElementById('profileEmail')?.value.trim();
      const phone    = document.getElementById('profilePhone')?.value.trim();
      const location = document.getElementById('profileLocation')?.value.trim();

      // Reflect in profile card
      if (name)     { const el = document.getElementById('displayName');     if (el) el.textContent = name; }
      if (email)    { const el = document.getElementById('displayEmail');    if (el) el.textContent = email; }
      if (phone)    { const el = document.getElementById('displayPhone');    if (el) el.textContent = phone; }
      if (location) { const el = document.getElementById('displayLocation'); if (el) el.textContent = location; }

      closeProfileModal(editProfileModal);
    });
  }


  /* ============================================================
     9. CHANGE PASSWORD — basic validation
  ============================================================ */
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', e => {
      e.preventDefault();
      const newPw     = document.getElementById('newPassword')?.value;
      const confirmPw = document.getElementById('confirmPassword')?.value;

      if (newPw !== confirmPw) {
        const confirmEl = document.getElementById('confirmPassword');
        if (confirmEl) {
          confirmEl.style.outline = '2px solid rgba(224,115,59,0.9)';
          confirmEl.setAttribute('placeholder', 'Passwords do not match');
          setTimeout(() => {
            confirmEl.style.outline = '';
            confirmEl.setAttribute('placeholder', '');
          }, 2000);
        }
        return;
      }
      closeProfileModal(changePasswordModal);
    });
  }

});
/* =============================================
   Profile Settings Modal System
   (Customer Profile style — Waiter/Chief)
============================================= */
(function () {

  const overlays = {
    settings:      document.getElementById('settingsOverlay'),
    editProfile:   document.getElementById('editProfileOverlay'),
    editPassword:  document.getElementById('editPasswordOverlay'),
  };

  const toast = document.getElementById('successToast');
  let toastTimer = null;

  /* --- Modal Helpers --- */
  function openModal(key) {
    const el = overlays[key];
    if (el) el.classList.add('active');
  }
  function closeModal(key) {
    const el = overlays[key];
    if (el) el.classList.remove('active');
  }

  /* --- Toast --- */
  function showToast(msg, isError = false) {
    if (!toast) return;
    const msgSpan = toast.querySelector('.toast-msg');
    const iconEl  = toast.querySelector('.toast-icon i');
    if (msgSpan) msgSpan.textContent = msg;
    if (iconEl)  iconEl.className = isError ? 'fas fa-xmark' : 'fas fa-check';
    toast.style.borderColor = isError
      ? 'rgba(224,85,85,0.45)'
      : 'rgba(200,169,106,0.45)';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  /* --- Validation Helpers --- */
  function setError(inp, errEl, msg) {
    inp.classList.add('input-error');
    if (errEl) errEl.textContent = msg;
    return false;
  }
  function clearError(inp, errEl) {
    inp.classList.remove('input-error');
    if (errEl) errEl.textContent = '';
    return true;
  }
  function validateNotEmpty(inp, errEl, label) {
    return inp.value.trim()
      ? clearError(inp, errEl)
      : setError(inp, errEl, `${label} is required.`);
  }
  function validateEmail(inp, errEl) {
    if (!inp.value.trim()) return setError(inp, errEl, 'Email is required.');
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())
      ? clearError(inp, errEl)
      : setError(inp, errEl, 'Enter a valid email address.');
  }
  function validatePhone(inp, errEl) {
    if (!inp.value.trim()) return setError(inp, errEl, 'Phone is required.');
    return /^[\+]?[\d\s\-().]{7,20}$/.test(inp.value.trim())
      ? clearError(inp, errEl)
      : setError(inp, errEl, 'Enter a valid phone number.');
  }

  /* --- Password Strength --- */
  function updateStrengthUI(pwd) {
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    if (!fill || !label) return;
    let score = 0;
    if (pwd.length >= 8)           score++;
    if (pwd.length >= 12)          score++;
    if (/[A-Z]/.test(pwd))         score++;
    if (/[0-9]/.test(pwd))         score++;
    if (/[^A-Za-z0-9]/.test(pwd))  score++;
    const levels = [
      { pct: 0,   color: 'transparent', text: '' },
      { pct: 20,  color: '#e05555',     text: 'Very Weak' },
      { pct: 40,  color: '#e07040',     text: 'Weak' },
      { pct: 60,  color: '#e0a040',     text: 'Fair' },
      { pct: 80,  color: '#8bc34a',     text: 'Strong' },
      { pct: 100, color: '#4caf50',     text: 'Very Strong' },
    ];
    const lvl = levels[score];
    fill.style.width      = lvl.pct + '%';
    fill.style.background = lvl.color;
    label.textContent     = lvl.text;
    label.style.color     = lvl.color;
  }

  /* --- Live Profile Update --- */
  function applyProfileToPage(name, email, phone, address) {
    const map = {
      displayName:     name,
      displayEmail:    email,
      displayPhone:    phone,
      displayLocation: address, // Waiter uses displayLocation
      displayAddress:  address, // fallback
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  /* --- Password Toggles --- */
  function initPasswordToggles() {
    document.querySelectorAll('.pw-toggle-cp').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp  = document.getElementById(btn.dataset.target);
        const icon = btn.querySelector('i');
        if (!inp) return;
        if (inp.type === 'password') {
          inp.type = 'text';
          icon.className = 'far fa-eye-slash';
        } else {
          inp.type = 'password';
          icon.className = 'far fa-eye';
        }
      });
    });
  }

  /* --- Profile Form --- */
  function initProfileForm() {
    const nameInput    = document.getElementById('inputName');
    const addressInput = document.getElementById('inputAddress');
    const phoneInput   = document.getElementById('inputPhone');
    const emailInput   = document.getElementById('inputEmail');
    const saveBtn      = document.getElementById('saveProfile');
    if (!saveBtn) return;

    // Pre-fill with current displayed values
    const fillVal = (inputEl, sourceId) => {
      const src = document.getElementById(sourceId);
      if (inputEl && src) inputEl.value = src.textContent.trim();
    };
    fillVal(nameInput,    'displayName');
    fillVal(emailInput,   'displayEmail');
    fillVal(phoneInput,   'displayPhone');
    fillVal(addressInput, 'displayLocation');
    if (!addressInput.value) fillVal(addressInput, 'displayAddress');

    saveBtn.addEventListener('click', () => {
      const v1 = validateNotEmpty(nameInput,    document.getElementById('nameError'),    'Full name');
      const v2 = validateNotEmpty(addressInput, document.getElementById('addressError'), 'Address');
      const v3 = validatePhone   (phoneInput,   document.getElementById('phoneError'));
      const v4 = validateEmail   (emailInput,   document.getElementById('emailError'));
      if (!v1 || !v2 || !v3 || !v4) return;

      applyProfileToPage(
        nameInput.value.trim(),
        emailInput.value.trim(),
        phoneInput.value.trim(),
        addressInput.value.trim()
      );
      closeModal('editProfile');
      showToast('Profile updated successfully!');
    });
  }

  /* --- Password Form --- */
  function initPasswordForm() {
    const curInp  = document.getElementById('inputCurrentPwd');
    const newInp  = document.getElementById('inputNewPwd');
    const confInp = document.getElementById('inputConfirmPwd');
    const saveBtn = document.getElementById('savePassword');
    if (!saveBtn) return;

    newInp?.addEventListener('input', () => {
      updateStrengthUI(newInp.value);
      clearError(newInp, document.getElementById('newPwdError'));
    });

    saveBtn.addEventListener('click', () => {
      let valid = true;
      if (!curInp.value) {
        setError(curInp, document.getElementById('currentPwdError'), 'Enter your current password.');
        valid = false;
      } else {
        clearError(curInp, document.getElementById('currentPwdError'));
      }
      const newPwd = newInp.value;
      if (!newPwd) {
        setError(newInp, document.getElementById('newPwdError'), 'Enter a new password.');
        valid = false;
      } else if (newPwd.length < 8) {
        setError(newInp, document.getElementById('newPwdError'), 'Password must be at least 8 characters.');
        valid = false;
      } else if (newPwd === curInp.value) {
        setError(newInp, document.getElementById('newPwdError'), 'New password must differ from current.');
        valid = false;
      } else {
        clearError(newInp, document.getElementById('newPwdError'));
      }
      if (!confInp.value) {
        setError(confInp, document.getElementById('confirmPwdError'), 'Please confirm your new password.');
        valid = false;
      } else if (confInp.value !== newPwd) {
        setError(confInp, document.getElementById('confirmPwdError'), 'Passwords do not match.');
        valid = false;
      } else {
        clearError(confInp, document.getElementById('confirmPwdError'));
      }
      if (!valid) return;

      curInp.value = ''; newInp.value = ''; confInp.value = '';
      updateStrengthUI('');
      closeModal('editPassword');
      showToast('Password changed successfully!');
    });
  }

  /* --- Modal Wiring --- */
  function initModals() {
    document.getElementById('openSettingsBtn')
      ?.addEventListener('click', () => openModal('settings'));
    document.getElementById('closeSettings')
      ?.addEventListener('click', () => closeModal('settings'));
    document.getElementById('closeEditProfile')
      ?.addEventListener('click', () => closeModal('editProfile'));
    document.getElementById('closeEditPassword')
      ?.addEventListener('click', () => closeModal('editPassword'));

    document.getElementById('openEditProfile')?.addEventListener('click', () => {
      closeModal('settings');
      openModal('editProfile');
    });
    document.getElementById('openEditPassword')?.addEventListener('click', () => {
      closeModal('settings');
      openModal('editPassword');
    });

    // Click outside → close
    Object.values(overlays).forEach(overlay => {
      overlay?.addEventListener('click', e => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });

    // Escape key → close
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const active = Object.entries(overlays).find(([, el]) => el?.classList.contains('active'));
      if (active) closeModal(active[0]);
    });
  }

  /* --- Boot --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initModals();
      initPasswordToggles();
      initProfileForm();
      initPasswordForm();
    });
  } else {
    initModals();
    initPasswordToggles();
    initProfileForm();
    initPasswordForm();
  }

})();