document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('newOrderModal');
  const openBtn = document.querySelector('[data-new-order]');

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
