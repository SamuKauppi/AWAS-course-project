// auth.js
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  function showTab(tab) {
    document.getElementById('login').classList.remove('active');
    document.getElementById('register').classList.remove('active');
    document.getElementById('loginTabBtn').classList.remove('active');
    document.getElementById('registerTabBtn').classList.remove('active');
    document.getElementById(tab).classList.add('active');
    document.getElementById(tab + 'TabBtn').classList.add('active');
  }
  window.showTab = showTab;

  // tab button listeners added
  document.getElementById('loginTabBtn').addEventListener('click', () => showTab('login'));
  document.getElementById('registerTabBtn').addEventListener('click', () => showTab('register'));

  // URL-encode helper
  function toUrlEncoded(obj) {
    return Object.keys(obj)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]))
      .join('&');
  }

  function isValidUsername(username) {
      return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  }

  function isValidPassword(password) {
      return typeof password === 'string' && password.length >= 6;
    }

  // REGISTER handler
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    if (!isValidUsername(username)) {
        alert("Username must be 3–20 characters, only letters, numbers, and underscores.");
        return;
      }

    if (!isValidPassword(password)) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: toUrlEncoded({ username, password })
    });
    const msg = document.getElementById('registerSuccessMsg');
    if (res.ok) {
      msg.textContent = 'Registration successful!';
      msg.style.color = 'green';
      msg.style.display = 'block';
      e.target.reset();
    } else {
      msg.textContent = 'Registration failed: ' + await res.text();
      msg.style.color = 'red';
      msg.style.display = 'block';
    }
  });

  // LOGIN handler
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    if (!isValidUsername(username)) {
        alert("Username must be 3–20 characters, only letters, numbers, and underscores.");
        return;
    }

    if (!isValidPassword(password)) {
        alert("Password must be at least 6 characters long.");
        return;
    }
  
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: toUrlEncoded({ username, password }),
      credentials: 'include'
    });
    if (res.ok) {
      // on success, go to main page
      window.location.href = 'main_page.html';
    } else {
      alert('Login failed: ' + await res.text());
    }
  });
});
