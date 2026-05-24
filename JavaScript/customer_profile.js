/**
 * customer_profile.js
 * Fully connected to DB:
 * - Loads real profile data, stats, recent orders
 * - Saves name, email, phone, address
 * - Changes password
 * - Uploads avatar to server
 */

/* =============================================
   State
============================================= */
const overlays = {
  settings:     document.getElementById("settingsOverlay"),
  editProfile:  document.getElementById("editProfileOverlay"),
  editPassword: document.getElementById("editPasswordOverlay"),
};

const toast = document.getElementById("successToast");
let toastTimer = null;

/* =============================================
   Modal Helpers
============================================= */
function openModal(key) {
  const el = overlays[key];
  if (el) el.classList.add("active");
}

function closeModal(key) {
  const el = overlays[key];
  if (el) el.classList.remove("active");
}

function closeAllModals() {
  Object.values(overlays).forEach((el) => el?.classList.remove("active"));
}

/* =============================================
   Toast
============================================= */
function showToast(msg, isError = false) {
  const msgSpan = toast.querySelector(".toast-msg");
  const iconEl  = toast.querySelector(".toast-icon i");

  if (msgSpan) msgSpan.textContent = msg;
  if (iconEl)  iconEl.className    = isError ? "fas fa-xmark" : "fas fa-check";

  toast.style.borderColor = isError
    ? "rgba(224,85,85,0.45)"
    : "rgba(200,169,106,0.45)";

  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

/* =============================================
   Form Validation Helpers
============================================= */
function setError(inputEl, errorEl, msg) {
  inputEl.classList.add("input-error");
  if (errorEl) errorEl.textContent = msg;
  return false;
}

function clearError(inputEl, errorEl) {
  inputEl.classList.remove("input-error");
  if (errorEl) errorEl.textContent = "";
  return true;
}

function validateNotEmpty(inputEl, errorEl, label) {
  const val = inputEl.value.trim();
  if (!val) return setError(inputEl, errorEl, `${label} is required.`);
  return clearError(inputEl, errorEl);
}

function validateEmail(inputEl, errorEl) {
  const val = inputEl.value.trim();
  if (!val) return setError(inputEl, errorEl, "Email is required.");
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  if (!ok)  return setError(inputEl, errorEl, "Enter a valid email address.");
  return clearError(inputEl, errorEl);
}

function validatePhone(inputEl, errorEl) {
  const val = inputEl.value.trim();
  if (!val) return setError(inputEl, errorEl, "Phone number is required.");
  const ok = /^[\+]?[\d\s\-().]{7,20}$/.test(val);
  if (!ok)  return setError(inputEl, errorEl, "Enter a valid phone number.");
  return clearError(inputEl, errorEl);
}

/* =============================================
   Password Strength
============================================= */
function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)          score++;
  if (pwd.length >= 12)         score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function updateStrengthUI(pwd) {
  const fill  = document.getElementById("strengthFill");
  const label = document.getElementById("strengthLabel");
  if (!fill || !label) return;

  const score = getPasswordStrength(pwd);
  const levels = [
    { pct: 0,   color: "transparent",     text: ""           },
    { pct: 20,  color: "var(--danger)",   text: "Very Weak"  },
    { pct: 40,  color: "#e07040",         text: "Weak"       },
    { pct: 60,  color: "var(--warning)",  text: "Fair"       },
    { pct: 80,  color: "#8bc34a",         text: "Strong"     },
    { pct: 100, color: "var(--success)",  text: "Very Strong"},
  ];

  const lvl = levels[score];
  fill.style.width      = lvl.pct + "%";
  fill.style.background = lvl.color;
  label.textContent     = lvl.text;
  label.style.color     = lvl.color;
}

/* =============================================
   Apply Profile Data to Page
============================================= */
function applyProfileToPage(name, email, phone, address) {
  const displayName    = document.getElementById("displayName");
  const displayEmail   = document.getElementById("displayEmail");
  const displayPhone   = document.getElementById("displayPhone");
  const displayAddress = document.getElementById("displayAddress");

  if (displayName)    displayName.textContent    = name    || '—';
  if (displayEmail)   displayEmail.textContent   = email   || '—';
  if (displayPhone)   displayPhone.textContent   = phone   || '—';
  if (displayAddress) displayAddress.textContent = address || '—';
}

/* =============================================
   Render Recent Orders
============================================= */
function renderRecentOrders(orders) {
  const list = document.querySelector(".recent-list");
  if (!list) return;

  if (!orders || orders.length === 0) {
    list.innerHTML = '<p style="color:#aaa;padding:1rem;">No orders yet.</p>';
    return;
  }

  const statusClass = {
    delivered: 'status-delivered',
    queued:    'status-pending',
    pending:   'status-pending',
    in_progress: 'status-pending',
    ready:     'status-delivered',
    served:    'status-delivered',
    cancelled: 'status-cancelled',
  };

  const statusLabel = {
    queued: 'Pending',
    pending: 'Pending',
    in_progress: 'Preparing',
    ready: 'Ready',
    served: 'Delivered',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  list.innerHTML = orders.map((order, i) => {
    const date     = new Date(order.created_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
    const status   = order.status || 'pending';
    const badgeCls = statusClass[status] || 'status-pending';
    const label    = statusLabel[status] || capitalize(status.replaceAll('_', ' '));
    const divider  = i < orders.length - 1 ? '<div class="recent-divider"></div>' : '';

    return `
      <div class="recent-item">
        <div class="recent-info">
          <div class="recent-top">
            <span class="recent-id">Order #${order.id}</span>
            <span class="order-status ${badgeCls}">${label}</span>
            <span class="recent-price">$${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
          <p class="recent-items">${order.item_names || 'No items'}</p>
          <p class="recent-date"><i class="far fa-clock"></i> ${date}</p>
        </div>
      </div>
      ${divider}
    `;
  }).join('');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* =============================================
   Load Profile from DB
============================================= */
async function loadProfile() {
  try {
    const res = await fetch('../api/profile.php');

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    const data = await res.json();
    if (data.error) return;

    const { user, stats, recent_orders } = data;

    // Display fields
    applyProfileToPage(user.name, user.email, user.phone, user.address);

    // Member since
    const sinceEl = document.querySelector('.profile-since');
    if (sinceEl && user.created_at) {
      const date = new Date(user.created_at);
      sinceEl.textContent = 'Member since ' + date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }

    // Avatar
    if (user.avatar_path) {
      const avatarEl = document.getElementById("avatarImg");
      if (avatarEl) avatarEl.src = '../' + user.avatar_path;
    }

    // Pre-fill form inputs
    const fields = { inputName: user.name, inputEmail: user.email, inputPhone: user.phone, inputAddress: user.address };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    });

    // Stats
    const statValues = document.querySelectorAll(".stat-value");
    if (statValues[0]) statValues[0].textContent = stats.total_orders || 0;
    if (statValues[1]) statValues[1].textContent = `$${parseFloat(stats.total_spent || 0).toFixed(0)}`;

    // Recent orders
    renderRecentOrders(recent_orders);

  } catch (err) {
    console.error('Could not load profile:', err);
  }
}

/* =============================================
   Avatar Upload — saves to server
============================================= */
function initAvatarUpload() {
  const input    = document.getElementById("avatarUpload");
  const avatarEl = document.getElementById("avatarImg");
  if (!input || !avatarEl) return;

  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5MB.", true);
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", true);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => { avatarEl.src = e.target.result; };
    reader.readAsDataURL(file);

    // Upload to server
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res    = await fetch('../api/profile.php', { method: 'POST', body: formData });
      const result = await res.json();

      if (result.success) {
        showToast("Profile photo updated!");
      } else {
        showToast(result.error || "Could not upload photo.", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Network error uploading photo.", true);
    }
  });
}

/* =============================================
   Show/Hide Password Toggles
============================================= */
function initPasswordToggles() {
  document.querySelectorAll(".pw-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input    = document.getElementById(targetId);
      const icon     = btn.querySelector("i");
      if (!input) return;

      if (input.type === "password") {
        input.type     = "text";
        icon.className = "far fa-eye-slash";
      } else {
        input.type     = "password";
        icon.className = "far fa-eye";
      }
    });
  });
}

/* =============================================
   Profile Form Save
============================================= */
function initProfileForm() {
  const nameInput    = document.getElementById("inputName");
  const addressInput = document.getElementById("inputAddress");
  const phoneInput   = document.getElementById("inputPhone");
  const emailInput   = document.getElementById("inputEmail");

  const nameError    = document.getElementById("nameError");
  const addressError = document.getElementById("addressError");
  const phoneError   = document.getElementById("phoneError");
  const emailError   = document.getElementById("emailError");

  const saveBtn = document.getElementById("saveProfile");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", async () => {
    const v1 = validateNotEmpty(nameInput,    nameError,    "Full name");
    const v2 = validateNotEmpty(addressInput, addressError, "Address");
    const v3 = validatePhone(phoneInput, phoneError);
    const v4 = validateEmail(emailInput, emailError);
    if (!v1 || !v2 || !v3 || !v4) return;

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Saving…';

    try {
      const res    = await fetch('../api/profile.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:  'update_profile',
          name:    nameInput.value.trim(),
          email:   emailInput.value.trim(),
          phone:   phoneInput.value.trim(),
          address: addressInput.value.trim(),
        }),
      });
      const result = await res.json();

      if (result.success) {
        applyProfileToPage(
          nameInput.value.trim(),
          emailInput.value.trim(),
          phoneInput.value.trim(),
          addressInput.value.trim()
        );
        closeModal("editProfile");
        showToast("Profile updated successfully!");
      } else {
        showToast(result.error || 'Could not save profile.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error. Please try again.', true);
    } finally {
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Update Profile';
    }
  });
}

/* =============================================
   Password Form Save
============================================= */
function initPasswordForm() {
  const currentPwdInput = document.getElementById("inputCurrentPwd");
  const newPwdInput     = document.getElementById("inputNewPwd");
  const confirmPwdInput = document.getElementById("inputConfirmPwd");

  const currentPwdError = document.getElementById("currentPwdError");
  const newPwdError     = document.getElementById("newPwdError");
  const confirmPwdError = document.getElementById("confirmPwdError");

  const saveBtn = document.getElementById("savePassword");
  if (!saveBtn) return;

  newPwdInput?.addEventListener("input", () => {
    updateStrengthUI(newPwdInput.value);
    clearError(newPwdInput, newPwdError);
  });

  saveBtn.addEventListener("click", async () => {
    let valid = true;

    if (!currentPwdInput.value) {
      setError(currentPwdInput, currentPwdError, "Please enter your current password.");
      valid = false;
    } else {
      clearError(currentPwdInput, currentPwdError);
    }

    const newPwd = newPwdInput.value;
    if (!newPwd) {
      setError(newPwdInput, newPwdError, "Please enter a new password.");
      valid = false;
    } else if (newPwd.length < 8) {
      setError(newPwdInput, newPwdError, "Password must be at least 8 characters.");
      valid = false;
    } else if (newPwd === currentPwdInput.value) {
      setError(newPwdInput, newPwdError, "New password must differ from current password.");
      valid = false;
    } else {
      clearError(newPwdInput, newPwdError);
    }

    if (!confirmPwdInput.value) {
      setError(confirmPwdInput, confirmPwdError, "Please confirm your new password.");
      valid = false;
    } else if (confirmPwdInput.value !== newPwd) {
      setError(confirmPwdInput, confirmPwdError, "Passwords do not match.");
      valid = false;
    } else {
      clearError(confirmPwdInput, confirmPwdError);
    }

    if (!valid) return;

    saveBtn.disabled    = true;
    saveBtn.textContent = 'Saving…';

    try {
      const res    = await fetch('../api/profile.php', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action:           'change_password',
          current_password: currentPwdInput.value,
          new_password:     newPwd,
        }),
      });
      const result = await res.json();

      if (result.success) {
        currentPwdInput.value = "";
        newPwdInput.value     = "";
        confirmPwdInput.value = "";
        updateStrengthUI("");
        closeModal("editPassword");
        showToast("Password changed successfully!");
      } else {
        setError(currentPwdInput, currentPwdError, result.error || 'Could not change password.');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error. Please try again.', true);
    } finally {
      saveBtn.disabled    = false;
      saveBtn.textContent = 'Update Password';
    }
  });
}

/* =============================================
   Modal Wiring
============================================= */
function initModals() {
  document.getElementById("openSettingsBtn")
    ?.addEventListener("click", () => openModal("settings"));

  document.getElementById("closeSettings")
    ?.addEventListener("click", () => closeModal("settings"));
  document.getElementById("closeEditProfile")
    ?.addEventListener("click", () => closeModal("editProfile"));
  document.getElementById("closeEditPassword")
    ?.addEventListener("click", () => closeModal("editPassword"));

  document.getElementById("openEditProfile")?.addEventListener("click", () => {
    closeModal("settings");
    openModal("editProfile");
  });
  document.getElementById("openEditPassword")?.addEventListener("click", () => {
    closeModal("settings");
    openModal("editPassword");
  });

  Object.values(overlays).forEach((overlay) => {
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const active = Object.entries(overlays).find(([, el]) =>
      el?.classList.contains("active")
    );
    if (active) closeModal(active[0]);
  });
}

/* =============================================
   Boot
============================================= */
document.addEventListener("DOMContentLoaded", () => {
  loadProfile();
  initModals();
  initAvatarUpload();
  initPasswordToggles();
  initProfileForm();
  initPasswordForm();
});
