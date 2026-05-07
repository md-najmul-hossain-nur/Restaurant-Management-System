/**
 * customer_profile.js
 * Handles modal toggling, form submissions, and UI feedback
 */

const overlays = {
  settings:     document.getElementById('settingsOverlay'),
  editProfile:  document.getElementById('editProfileOverlay'),
  editPassword: document.getElementById('editPasswordOverlay'),
};

const toast = document.getElementById('successToast');
let toastTimer;

// Helper functions for modal visibility
function openModal(key) {
  if (overlays[key]) {
    overlays[key].classList.add('active');
  }
}

function closeModal(key) {
  if (overlays[key]) {
    overlays[key].classList.remove('active');
  }
}

// Toast notification logic
function showToast(msg) {
  const msgSpan = toast.querySelector('.toast-msg');
  if (msgSpan) {
    msgSpan.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  
  // Settings Button
  const settingsBtn = document.querySelector('.settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openModal('settings'));
  }

  // Modal Close Buttons
  document.getElementById('closeSettings')?.addEventListener('click', () => closeModal('settings'));
  document.getElementById('closeEditProfile')?.addEventListener('click', () => closeModal('editProfile'));
  document.getElementById('closeEditPassword')?.addEventListener('click', () => closeModal('editPassword'));

  // Modal Transitions (Sub-modals)
  document.getElementById('openEditProfile')?.addEventListener('click', () => {
    closeModal('settings');
    openModal('editProfile');
  });

  document.getElementById('openEditPassword')?.addEventListener('click', () => {
    closeModal('settings');
    openModal('editPassword');
  });

  // Close modal when clicking on the overlay background
  Object.values(overlays).forEach(overlay => {
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Update Buttons (Form Submissions)
  document.querySelectorAll('.btn-update').forEach(btn => {
    btn.addEventListener('click', () => {
      if (overlays.editProfile.classList.contains('active')) {
        closeModal('editProfile');
        showToast('Profile updated successfully!');
      } else if (overlays.editPassword.classList.contains('active')) {
        closeModal('editPassword');
        showToast('Password changed successfully!');
      }
    });
  });
});