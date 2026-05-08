
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.section-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // When clocked out (Clock In mode), keep tabs visible but disabled.
    if (document.body.classList.contains('is-clocked-out')) return;
    const sectionId = tab.getAttribute('data-section'); 
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(sectionId).classList.add('active');
  });
});

// -----------
// Clock Out / Clock In (shared by dashboards)
// In-page toggle: shows a "clocked out" banner but keeps tabs usable.
(() => {
  const clockBtn = document.querySelector('.panel.hero [data-clock-out]');
  if (!clockBtn) return;

  const main = document.querySelector('.main-content');
  const bannerId = 'clockoutBanner';
  let banner = document.getElementById(bannerId);

  if (!banner && main) {
    banner = document.createElement('div');
    banner.id = bannerId;
    banner.className = 'clockout-banner';
    banner.textContent = 'You are in clock out Now';
    main.prepend(banner);
  }

  const applyState = (isClockedOut) => {
    document.body.classList.toggle('is-clocked-out', isClockedOut);
    clockBtn.textContent = isClockedOut ? 'Clock In' : 'Clock Out';
    clockBtn.setAttribute('aria-pressed', String(isClockedOut));
  };

  // Default: clocked in
  applyState(false);

  clockBtn.addEventListener('click', () => {
    const next = !document.body.classList.contains('is-clocked-out');
    applyState(next);
  });
})();

// -----------
// Orders: make "Mark Ready" logical based on status
(() => {
  const cards = document.querySelectorAll('.order-card');
  if (!cards.length) return;

  const normalize = (value) => (value || '').trim().toLowerCase();

  const getStatus = (card) => {
    const statusEl = card.querySelector('.status-badge');
    return {
      el: statusEl,
      value: normalize(statusEl ? statusEl.textContent : '')
    };
  };

  const getActionButton = (card) => {
    return (
      card.querySelector('.actions [data-mark-ready]') ||
      card.querySelector('.actions button') ||
      null
    );
  };

  const setActionPill = (card, text) => {
    const pill = card.querySelector('.actions .pill');
    if (pill && text) pill.textContent = text;
  };

  const configureCard = (card) => {
    const { el: statusEl, value: status } = getStatus(card);
    const actionBtn = getActionButton(card);
    if (!actionBtn || !statusEl) return;

    const isQueued = status.includes('queued');
    const isInProgress = status.includes('in progress') || status.includes('in-progress');
    const isReady = status.includes('ready');
    const isServing = status.includes('serving');
    const isServed = status.includes('served') || status.includes('completed') || status.includes('done');

    // Only Queued / In progress can be marked ready.
    if (isQueued || isInProgress) {
      actionBtn.hidden = false;
      actionBtn.disabled = false;
      actionBtn.textContent = 'Mark Ready';
      actionBtn.style.opacity = '';

      actionBtn.onclick = () => {
        statusEl.textContent = 'Ready';
        setActionPill(card, 'Awaiting waiter');
        actionBtn.textContent = '✓ Ready';
        actionBtn.disabled = true;
        actionBtn.style.opacity = '0.6';
        // Once it's ready, don't keep showing an action button.
        setTimeout(() => {
          actionBtn.hidden = true;
        }, 400);
      };

      return;
    }

    // Already ready / serving / served: do not show Mark Ready.
    if (isReady) {
      actionBtn.hidden = true;
      actionBtn.disabled = true;
      actionBtn.onclick = null;
      return;
    }

    if (isServing) {
      // Serving should not show "Mark Ready"; allow marking served instead.
      actionBtn.hidden = false;
      actionBtn.disabled = false;
      actionBtn.textContent = 'Mark Served';
      actionBtn.style.opacity = '';
      actionBtn.onclick = () => {
        statusEl.textContent = 'Served';
        setActionPill(card, 'Completed');
        actionBtn.disabled = true;
        actionBtn.hidden = true;
      };
      return;
    }

    if (isServed) {
      actionBtn.hidden = true;
      actionBtn.disabled = true;
      actionBtn.onclick = null;
      return;
    }
  };

  cards.forEach(configureCard);
})();

//-----------

const modal = document.getElementById('addEmployeeModal');
const addEmployeeBtn = document.querySelector('.add-employee-btn');
const modalClose = modal ? modal.querySelector('.modal-close') : null;

const openModal = () => {
  if (!modal) return;
  modal.classList.add('active');
};

const closeModal = () => {
  if (!modal) return;
  modal.classList.remove('active');
};

if (addEmployeeBtn) {
  addEmployeeBtn.addEventListener('click', () => {
    openModal();
  });
}

if (modalClose) {
  modalClose.addEventListener('click', () => {
    closeModal();
  });
}

const modalCancelBtn = document.querySelector('#addEmployeeModal .btn-secondary, #addEmployeeModal button[type="reset"]');
if (modalCancelBtn) {
  modalCancelBtn.addEventListener('click', () => {
    closeModal();
  });
}

//-----
document.querySelectorAll('.table-edit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const editTableModal = document.getElementById('editTableModal');
    if (editTableModal) {
      editTableModal.classList.add('active');
    }
  });
});

const editTableModal = document.getElementById('editTableModal');
if (editTableModal) {
  const closeBtn = editTableModal.querySelector('.modal-close');
  const cancelBtn = editTableModal.querySelector('.btn-secondary');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      editTableModal.classList.remove('active');
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editTableModal.classList.remove('active');
    });
  }
  
}
//-----
const tableModal = document.getElementById('addTableModal');

const openTableModal = () => {
  if (!tableModal) return;
  tableModal.classList.add('active');
};

const closeTableModal = () => {
  if (!tableModal) return;
  tableModal.classList.remove('active');
};

if (tableModal) {
  const tableCloseBtn = tableModal.querySelector('.modal-close');

  if (tableCloseBtn) {
    tableCloseBtn.addEventListener('click', () => closeTableModal());
  }

  const tableCancelBtn = tableModal.querySelector('.btn-secondary, button[type="reset"]');
  if (tableCancelBtn) {
    tableCancelBtn.addEventListener('click', () => closeTableModal());
  }
}

const addTableBtn = document.querySelector('.add-table-btn');
if (addTableBtn) {
  addTableBtn.addEventListener('click', () => {
    openTableModal();
  });
}

//----
const editMenuModal = document.getElementById('editMenuModal');
const editMenuForm = document.getElementById('editMenuForm');

if (editMenuModal) {
  let currentMenuCard = null;

  document.querySelectorAll('.menu-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.menu-card');
      if (!card) return;

      currentMenuCard = card;

      // Populate form with current data
      const name = card.querySelector('.menu-name').textContent;
      const price = card.querySelector('.menu-price').textContent;
      const desc = card.querySelector('.menu-desc').textContent;
      const tag = card.querySelector('.menu-tag').textContent;

      document.getElementById('editMenuName').value = name;
      document.getElementById('editMenuPrice').value = price;
      document.getElementById('editMenuDesc').value = desc;
      document.getElementById('editMenuTag').value = tag;

      // Clear image input
      document.getElementById('editMenuImage').value = '';

      editMenuModal.classList.add('active');
    });
  });

  const closeBtn = editMenuModal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      editMenuModal.classList.remove('active');
      currentMenuCard = null;
    });
  }

  const cancelBtn = editMenuModal.querySelector('.btn-secondary, button[type="reset"]');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editMenuModal.classList.remove('active');
      currentMenuCard = null;
    });
  }

  if (editMenuForm) {
    editMenuForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!currentMenuCard) return;

      // Get form data
      const name = document.getElementById('editMenuName').value.trim();
      const price = document.getElementById('editMenuPrice').value.trim();
      const desc = document.getElementById('editMenuDesc').value.trim();
      const tag = document.getElementById('editMenuTag').value.trim();
      const imageFile = document.getElementById('editMenuImage').files[0];

      // Update the card
      currentMenuCard.querySelector('.menu-name').textContent = name;
      currentMenuCard.querySelector('.menu-price').textContent = price;
      currentMenuCard.querySelector('.menu-desc').textContent = desc;
      currentMenuCard.querySelector('.menu-tag').textContent = tag;

      // Update image if provided
      if (imageFile) {
        const img = currentMenuCard.querySelector('.menu-thumb img');
        if (img) {
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target.result;
            img.alt = name;
          };
          reader.readAsDataURL(imageFile);
        }
      }

      editMenuModal.classList.remove('active');
      currentMenuCard = null;
    });
  }
}
