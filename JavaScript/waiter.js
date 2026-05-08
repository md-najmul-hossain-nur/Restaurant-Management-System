document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('newOrderModal');
  const openBtn = document.querySelector('[data-new-order]');

  // Add Recipe (Chief dashboard)
  const recipeModal = document.getElementById('addRecipeModal');
  const recipeOpenBtn = document.querySelector('[data-add-recipe]');
  const recipesGrid = document.getElementById('recipesGrid');

  // Order delivery logic (only deliver Ready orders)
  const orderSection = document.getElementById('order');
  const orderList = orderSection ? orderSection.querySelector('.order-list') : null;

  if (orderList) {
    orderList.addEventListener('click', (e) => {
      const deliverBtn = e.target.closest('[data-deliver-order]');
      if (!deliverBtn) return;

      const card = deliverBtn.closest('.order-card');
      const statusEl = card ? card.querySelector('.order-status') : null;
      if (!statusEl) return;

      const isReady = statusEl.classList.contains('order-status--ready');
      if (!isReady) return;

      statusEl.classList.remove('order-status--ready', 'order-status--kitchen');
      statusEl.classList.add('order-status--delivered');
      statusEl.textContent = 'Delivered';

      deliverBtn.remove();
    });
  }

  // New Order modal logic
  if (modal && openBtn) {
    const closeEls = modal.querySelectorAll('[data-order-close]');
    const placeBtn = modal.querySelector('[data-order-place]');
    const itemButtons = modal.querySelectorAll('[data-menu-item]');
    const selectedItemsList = document.getElementById('selectedItemsList');
    const selectedItemsTotal = document.getElementById('selectedItemsTotal');

    const selectedItems = new Map();

    const formatMoney = (amount) => {
      const safe = Number.isFinite(amount) ? amount : 0;
      return `$${safe.toFixed(2)}`;
    };

    const updateSelectedUI = () => {
      if (selectedItemsList) selectedItemsList.innerHTML = '';

      let total = 0;

      for (const [name, { qty, price }] of selectedItems.entries()) {
        total += qty * price;

        if (selectedItemsList) {
          const row = document.createElement('div');
          row.className = 'order-selected-row';
          row.textContent = `${qty} x ${name}`;
          selectedItemsList.appendChild(row);
        }
      }

      if (selectedItemsTotal) selectedItemsTotal.textContent = formatMoney(total);
    };

    const openModal = () => {
      modal.removeAttribute('inert');
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');

      const select = document.getElementById('orderTableSelect');
      if (select) {
        setTimeout(() => {
          try {
            select.focus();
          } catch {
            // ignore
          }
        }, 0);
      }
    };

    const closeModal = () => {
      modal.classList.remove('active');
      if (modal.contains(document.activeElement)) {
        try {
          openBtn.focus();
        } catch {
          // ignore
        }
      }
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('inert', '');
      selectedItems.clear();
      updateSelectedUI();
    };

    openBtn.addEventListener('click', openModal);

    closeEls.forEach((el) => {
      el.addEventListener('click', closeModal);
    });

    if (placeBtn) {
      placeBtn.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    itemButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name') || 'Item';
        const priceRaw = btn.getAttribute('data-price') || '0';
        const price = Number(priceRaw);

        const existing = selectedItems.get(name);
        if (existing) {
          selectedItems.set(name, { qty: existing.qty + 1, price: existing.price });
        } else {
          selectedItems.set(name, { qty: 1, price: Number.isFinite(price) ? price : 0 });
        }

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
  const profileModalCloseBtns = document.querySelectorAll('[data-profile-modal-close]');

  const openPopover = () => {
    if (!popover) return;
    popover.removeAttribute('inert');
    popover.classList.add('active');
    popover.setAttribute('aria-hidden', 'false');
    const firstAction = popover.querySelector('button');
    if (firstAction) {
      setTimeout(() => {
        try {
          firstAction.focus();
        } catch {
          // ignore
        }
      }, 0);
    }
  };

  const closePopover = () => {
    if (!popover) return;
    popover.classList.remove('active');
    if (popover.contains(document.activeElement) && settingsBtn) {
      try {
        settingsBtn.focus();
      } catch {
        // ignore
      }
    }
    popover.setAttribute('aria-hidden', 'true');
    popover.setAttribute('inert', '');
  };

  const openProfileModal = (targetModal, focusId) => {
    if (!targetModal) return;
    closePopover();
    targetModal.classList.add('active');
    targetModal.setAttribute('aria-hidden', 'false');
    const focusEl = focusId ? document.getElementById(focusId) : null;
    if (focusEl) {
      setTimeout(() => {
        try {
          focusEl.focus();
        } catch {
          // ignore
        }
      }, 0);
    }
  };

  const closeProfileModal = (targetModal) => {
    if (!targetModal) return;
    targetModal.classList.remove('active');
    targetModal.setAttribute('aria-hidden', 'true');
    if (settingsBtn) {
      try {
        settingsBtn.focus();
      } catch {
        // ignore
      }
    }
  };

  if (settingsBtn && popover) {
    settingsBtn.addEventListener('click', () => {
      const isOpen = popover.classList.contains('active');
      if (isOpen) closePopover();
      else openPopover();
    });

    document.addEventListener('click', (e) => {
      if (!popover.classList.contains('active')) return;
      const clickedInside = popover.contains(e.target) || settingsBtn.contains(e.target);
      if (!clickedInside) closePopover();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popover.classList.contains('active')) {
        closePopover();
      }
    });
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => openProfileModal(editProfileModal, 'profileFullName'));
  }

  if (passwordBtn) {
    passwordBtn.addEventListener('click', () => openProfileModal(changePasswordModal, 'currentPassword'));
  }

  profileModalCloseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      closeProfileModal(editProfileModal);
      closeProfileModal(changePasswordModal);
    });
  });

  const editProfileForm = document.getElementById('editProfileForm');
  if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeProfileModal(editProfileModal);
    });
  }

  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      closeProfileModal(changePasswordModal);
    });
  }
});
