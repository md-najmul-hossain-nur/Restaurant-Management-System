(function () {
  const ROLE_ROUTES = {
    customer: 'Customer.html',
    admin: 'Admin.html',
    waiter: 'Waiter.html',
    staff: 'Waiter.html',
    chief: 'Chief.html'
  };

  function getSelectedRole() {
    const roleSelect = document.getElementById('role');
    const role = roleSelect ? String(roleSelect.value || '').trim().toLowerCase() : '';
    return role;
  }

  function goToRolePage(role) {
    const target = ROLE_ROUTES[role];
    if (!target) {
      alert('Please select a valid role.');
      return;
    }

    try {
      localStorage.setItem('userRole', role);
    } catch {
      // ignore
    }

    window.location.href = target;
  }

  // login.html -> onsubmit="handleLogin(event)"
  window.handleLogin = function handleLogin(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const role = getSelectedRole();
    goToRolePage(role);
  };

  // signup.html -> onsubmit="handleSignup(event)"
  window.handleSignup = function handleSignup(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    const role = getSelectedRole();
    goToRolePage(role);
  };

  // login.html -> onclick="togglePassword()"
  // signup.html -> onclick="togglePassword('password', 'eye-icon-1')"
  window.togglePassword = function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId || 'password');
    if (!input) return;

    const nextType = input.type === 'password' ? 'text' : 'password';
    input.type = nextType;

    const icon = document.getElementById(iconId || 'eye-icon');
    if (icon) {
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    }
  };
})();
