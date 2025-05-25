const status = document.getElementById('status');

async function sendRequest(path, options = {}) {
  const res = await fetch(path, options);
  const text = await res.text();
  status.textContent = res.status + ' ' + text;
}

document.getElementById('registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const body = new URLSearchParams(new FormData(e.target));
  sendRequest('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
});

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const body = new URLSearchParams(new FormData(e.target));
  sendRequest('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
});

document.getElementById('transferForm').addEventListener('submit', e => {
  e.preventDefault();
  const body = new URLSearchParams(new FormData(e.target));
  sendRequest('/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
});


document.getElementById('logoutBtn').addEventListener('click', () => {
  sendRequest('/logout');
});
