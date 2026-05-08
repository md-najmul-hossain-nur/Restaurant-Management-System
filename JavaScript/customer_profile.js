/**
 * customer_profile.js
 * Handles modal toggling, form validation, live UI updates, avatar preview,
 * password strength meter, and show/hide password toggles.
 */

/* =============================================
   State
============================================= */
const overlays = {
  settings: document.getElementById("settingsOverlay"),
  editProfile: document.getElementById("editProfileOverlay"),
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
  const iconEl = toast.querySelector(".toast-icon i");

  if (msgSpan) msgSpan.textContent = msg;
  if (iconEl) iconEl.className = isError ? "fas fa-xmark" : "fas fa-check";

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
  if (!ok) return setError(inputEl, errorEl, "Enter a valid email address.");
  return clearError(inputEl, errorEl);
}

function validatePhone(inputEl, errorEl) {
  const val = inputEl.value.trim();
  if (!val) return setError(inputEl, errorEl, "Phone number is required.");
  // Accepts common formats: +1 (555) 123-4567, 5551234567, etc.
  const ok = /^[\+]?[\d\s\-().]{7,20}$/.test(val);
  if (!ok) return setError(inputEl, errorEl, "Enter a valid phone number.");
  return clearError(inputEl, errorEl);
}

/* =============================================
   Password Strength
============================================= */
function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score; // 0-5
}

function updateStrengthUI(pwd) {
  const fill = document.getElementById("strengthFill");
  const label = document.getElementById("strengthLabel");
  if (!fill || !label) return;

  const score = getPasswordStrength(pwd);

  const levels = [
    { pct: 0, color: "transparent", text: "" },
    { pct: 20, color: "var(--danger)", text: "Very Weak" },
    { pct: 40, color: "#e07040", text: "Weak" },
    { pct: 60, color: "var(--warning)", text: "Fair" },
    { pct: 80, color: "#8bc34a", text: "Strong" },
    { pct: 100, color: "var(--success)", text: "Very Strong" },
  ];

  const lvl = levels[score];
  fill.style.width = lvl.pct + "%";
  fill.style.background = lvl.color;
  label.textContent = lvl.text;
  label.style.color = lvl.color;
}

/* =============================================
   Live Profile Update (reflects on page)
============================================= */
function applyProfileToPage(name, email, phone, address) {
  const displayName = document.getElementById("displayName");
  const displayEmail = document.getElementById("displayEmail");
  const displayPhone = document.getElementById("displayPhone");
  const displayAddress = document.getElementById("displayAddress");

  if (displayName) displayName.textContent = name;
  if (displayEmail) displayEmail.textContent = email;
  if (displayPhone) displayPhone.textContent = phone;
  if (displayAddress) displayAddress.textContent = address;
}

/* =============================================
   Avatar Upload Preview
============================================= */
function initAvatarUpload() {
  const input = document.getElementById("avatarUpload");
  const avatarEl = document.getElementById("avatarImg");
  if (!input || !avatarEl) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      showToast(`Image must be under ${maxMB}MB.`, true);
      return;
    }
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarEl.src = e.target.result;
      showToast("Profile photo updated!");
    };
    reader.readAsDataURL(file);
  });
}

/* =============================================
   Show/Hide Password Toggles
============================================= */
function initPasswordToggles() {
  document.querySelectorAll(".pw-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector("i");
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        icon.className = "far fa-eye-slash";
      } else {
        input.type = "password";
        icon.className = "far fa-eye";
      }
    });
  });
}

/* =============================================
   Profile Form Save
============================================= */
function initProfileForm() {
  const nameInput = document.getElementById("inputName");
  const addressInput = document.getElementById("inputAddress");
  const phoneInput = document.getElementById("inputPhone");
  const emailInput = document.getElementById("inputEmail");

  const nameError = document.getElementById("nameError");
  const addressError = document.getElementById("addressError");
  const phoneError = document.getElementById("phoneError");
  const emailError = document.getElementById("emailError");

  const saveBtn = document.getElementById("saveProfile");
  if (!saveBtn) return;

  saveBtn.addEventListener("click", () => {
    // Run all validations; collect results
    const v1 = validateNotEmpty(nameInput, nameError, "Full name");
    const v2 = validateNotEmpty(addressInput, addressError, "Address");
    const v3 = validatePhone(phoneInput, phoneError);
    const v4 = validateEmail(emailInput, emailError);

    if (!v1 || !v2 || !v3 || !v4) return; // Stop if any fail

    // Apply to profile display
    applyProfileToPage(
      nameInput.value.trim(),
      emailInput.value.trim(),
      phoneInput.value.trim(),
      addressInput.value.trim()
    );

    closeModal("editProfile");
    showToast("Profile updated successfully!");
  });
}

/* =============================================
   Password Form Save
============================================= */
function initPasswordForm() {
  const currentPwdInput = document.getElementById("inputCurrentPwd");
  const newPwdInput = document.getElementById("inputNewPwd");
  const confirmPwdInput = document.getElementById("inputConfirmPwd");

  const currentPwdError = document.getElementById("currentPwdError");
  const newPwdError = document.getElementById("newPwdError");
  const confirmPwdError = document.getElementById("confirmPwdError");

  const saveBtn = document.getElementById("savePassword");
  if (!saveBtn) return;

  // Live strength meter
  newPwdInput?.addEventListener("input", () => {
    updateStrengthUI(newPwdInput.value);
    // Clear any existing error while typing
    clearError(newPwdInput, newPwdError);
  });

  saveBtn.addEventListener("click", () => {
    let valid = true;

    // Current password — just check not empty (backend would verify in real app)
    if (!currentPwdInput.value) {
      setError(
        currentPwdInput,
        currentPwdError,
        "Please enter your current password."
      );
      valid = false;
    } else {
      clearError(currentPwdInput, currentPwdError);
    }

    // New password — min 8 chars
    const newPwd = newPwdInput.value;
    if (!newPwd) {
      setError(newPwdInput, newPwdError, "Please enter a new password.");
      valid = false;
    } else if (newPwd.length < 8) {
      setError(
        newPwdInput,
        newPwdError,
        "Password must be at least 8 characters."
      );
      valid = false;
    } else if (newPwd === currentPwdInput.value) {
      setError(
        newPwdInput,
        newPwdError,
        "New password must differ from current password."
      );
      valid = false;
    } else {
      clearError(newPwdInput, newPwdError);
    }

    // Confirm password — must match
    if (!confirmPwdInput.value) {
      setError(
        confirmPwdInput,
        confirmPwdError,
        "Please confirm your new password."
      );
      valid = false;
    } else if (confirmPwdInput.value !== newPwd) {
      setError(confirmPwdInput, confirmPwdError, "Passwords do not match.");
      valid = false;
    } else {
      clearError(confirmPwdInput, confirmPwdError);
    }

    if (!valid) return;

    // Reset fields after success
    currentPwdInput.value = "";
    newPwdInput.value = "";
    confirmPwdInput.value = "";
    updateStrengthUI("");

    closeModal("editPassword");
    showToast("Password changed successfully!");
  });
}

/* =============================================
   Modal Wiring & Overlay Click-to-Close
============================================= */
function initModals() {
  // Open settings from button
  document
    .getElementById("openSettingsBtn")
    ?.addEventListener("click", () => openModal("settings"));

  // Close buttons
  document
    .getElementById("closeSettings")
    ?.addEventListener("click", () => closeModal("settings"));
  document
    .getElementById("closeEditProfile")
    ?.addEventListener("click", () => closeModal("editProfile"));
  document
    .getElementById("closeEditPassword")
    ?.addEventListener("click", () => closeModal("editPassword"));

  // Navigate from settings to sub-modals
  document.getElementById("openEditProfile")?.addEventListener("click", () => {
    closeModal("settings");
    openModal("editProfile");
  });

  document.getElementById("openEditPassword")?.addEventListener("click", () => {
    closeModal("settings");
    openModal("editPassword");
  });

  // Click outside modal content → close
  Object.values(overlays).forEach((overlay) => {
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  // Escape key closes top-most active modal
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
  initModals();
  initAvatarUpload();
  initPasswordToggles();
  initProfileForm();
  initPasswordForm();
});
