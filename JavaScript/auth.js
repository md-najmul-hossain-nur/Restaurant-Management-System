// auth.js
// Handles ONLY:
// 1. Password visibility toggle (login + signup)
// 2. Client-side confirm password check (signup only)
//
// Login and signup forms submit normally to PHP via method="post".
// No preventDefault, no redirect, no localStorage role storage.

// ── Password toggle ───────────────────────────────────────────
// Called from HTML: onclick="togglePassword()"
//                   onclick="togglePassword('password', 'eye-icon-1')"
window.togglePassword = function(inputId, iconId) {
  const input = document.getElementById(inputId || 'password');
  const icon  = document.getElementById(iconId  || 'eye-icon');
  if (!input) return;

  input.type = input.type === 'password' ? 'text' : 'password';

  if (icon) {
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  }
};

// ── Signup: confirm password check ───────────────────────────
// Runs before form submits to register.php
// Stops submission if passwords don't match
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form[action*="register.php"]');
  if (!form) return; // not on signup page — do nothing

  const messageEl = document.getElementById('signup-message');
  const params = new URLSearchParams(window.location.search);
  const signupMessages = {
    success: 'Signup successful. Please wait for admin approval before logging in.',
    missing: 'Please fill in all required fields.',
    password_mismatch: 'Passwords do not match.',
    weak_password: 'Password must be at least 8 characters long.',
    invalid_email: 'Please enter a valid email address.',
    exists: 'This email is already registered.',
    server: 'Signup failed. Please try again later.'
  };

  if (messageEl) {
    const error = params.get('error');
    const success = params.get('success');
    const messageKey = success === 'registered' ? 'success' : error;

    if (messageKey && signupMessages[messageKey]) {
      messageEl.textContent = signupMessages[messageKey];
      messageEl.classList.add(messageKey === 'success' ? 'is-success' : 'is-error');
    }
  }

  const loginMessageEl = document.getElementById('login-message');
  if (loginMessageEl) {
    const loginMessages = {
      missing: 'Please enter both email and password.',
      not_found: 'No account found for that email address.',
      bad_password: 'Incorrect password.',
      role_mismatch: 'Selected role does not match your account.',
      pending: 'Your account is pending admin approval. Please wait and try again later.',
      rejected: 'Your account was rejected by the admin.',
      server: 'Login failed. Please try again later.'
    };

    const error = params.get('error');
    if (error && loginMessages[error]) {
      loginMessageEl.textContent = loginMessages[error];
      loginMessageEl.classList.add('is-error');
    }
  }

  form.addEventListener('submit', (e) => {
    const pwd     = document.getElementById('password');
    const confirm = document.getElementById('confirm-password');
    if (!pwd || !confirm) return;

    const problem = pwd.value !== confirm.value
      ? 'Passwords do not match.'
      : (pwd.value.length < 8 ? 'Password must be at least 8 characters long.' : '');

    if (problem) {
      e.preventDefault();
      // Show error under confirm field
      let errEl = document.getElementById('confirm-pwd-error');
      if (!errEl) {
        errEl = document.createElement('span');
        errEl.id = 'confirm-pwd-error';
        errEl.style.cssText = 'color:#e07070;font-size:12px;margin-top:4px;display:block';
        confirm.parentNode.insertAdjacentElement('afterend', errEl);
      }
      errEl.textContent = problem;
      confirm.style.outline = '2px solid rgba(224,112,112,0.7)';
      return;
    }

    // Clear any previous error
    const errEl = document.getElementById('confirm-pwd-error');
    if (errEl) errEl.textContent = '';
    confirm.style.outline = '';
    // Form submits normally to register.php
  });
});
