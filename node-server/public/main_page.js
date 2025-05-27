document.addEventListener('DOMContentLoaded', () => {
  // Helper to URL encode a query object
  function toQueryString(params) {
    return Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  }

  // Load comments once on page load
  async function loadComments() {
    try {
      const res = await fetch('/comments', { credentials: 'include' });
      if (!res.ok) return;
      const comments = await res.json();
      const chatWindow = document.getElementById('chatWindow');
      chatWindow.innerHTML = '';
      comments.forEach(c => {
        const d = document.createElement('div');
        d.innerHTML = `[${c.created_at}] ${c.username}: ${c.comment}`;
        chatWindow.appendChild(d);
      });
      chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch {
      // silent fail
    }
  }

  // Check session on page load
  fetch('/session-status', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (!data.loggedIn) {
        return window.location.replace('auth.html');
      }

      // Display username
      document.getElementById('userDisplay').textContent = 'Logged in as: ' + data.user;
      document.getElementById('status').textContent = 'Welcome, ' + data.user;

      // Load balance
      fetch(`/balance?username=${encodeURIComponent(data.user)}`)
        .then(r => r.json())
        .then(b => {
          document.getElementById('userBalance').textContent = 'Balance: $' + b.money;
        })
        .catch(() => {
          document.getElementById('userBalance').textContent = 'Balance: N/A';
        });

      // Load comments once
      loadComments();
    })
    .catch(() => window.location.replace('auth.html'));

  // Logout handler
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/logout', { method: 'POST', credentials: 'include' });
    window.location.replace('auth.html');
  });

  // Handle transfer using GET request (for XSS testing)
  document.getElementById('transferForm').addEventListener('submit', async e => {
    e.preventDefault();
    const from = document.getElementById('userDisplay').textContent.split(': ')[1];
    const to = e.target.to.value.trim();
    const amount = e.target.amount.value;
    const msg = document.getElementById('transferMsg');
    msg.style.display = 'none';

    // Build GET query URL
    const url = `/transfer?${toQueryString({ from, to, amount })}`;

    try {
      const res = await fetch(url, { credentials: 'include' });
      const text = await res.text();
      if (res.ok) {
        msg.textContent = 'Transfer successful!';
        msg.style.color = 'green';

        // Update balance
        fetch(`/balance?username=${encodeURIComponent(from)}`)
          .then(r => r.json())
          .then(b => {
            document.getElementById('userBalance').textContent = 'Balance: $' + b.money;
          });

        e.target.reset();
      } else {
        msg.textContent = 'Transfer failed: ' + text;
        msg.style.color = 'red';
      }
    } catch {
      msg.textContent = 'Transfer failed: Network error';
      msg.style.color = 'red';
    }
    msg.style.display = 'block';
  });

  // Handle chat messages
  document.getElementById('chatForm').addEventListener('submit', async e => {
    e.preventDefault();
    const chatInput = document.getElementById('chatInput');
    const text = chatInput.value.trim();
    const author = document.getElementById('userDisplay').textContent.split(': ')[1];
    if (!text) return;

    await fetch('/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `author=${encodeURIComponent(author)}&text=${encodeURIComponent(text)}`,
      credentials: 'include'
    });

    chatInput.value = '';
    loadComments(); // Optional reload
  });
});
