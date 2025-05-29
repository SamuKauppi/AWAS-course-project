const path = require('path');
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require('fs');

// ----- APP -----
const app = express();
const port = 3000;

// ----- CORS -----
// tests to include credentials
//app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000', // e.g., 5500 or 3001
  credentials: true
}));

// ----- CSP HEADER -----
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
  );
  next();
});
// ----- Input Validation -----//
function isValidUsername(username) {
  return typeof username === 'string' && /^[a-zA-Z0-9]{3,20}$/.test(username);
}
function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

// ----- STATIC FRONTEND -----
app.use(express.static(path.join(__dirname, 'public')));

// ----- BODY PARSERS -----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----- SESSION SETUP -----
const crypto = require('crypto');

// generate a 32-byte (256-bit) random secret, hex-encoded
const sessionSecret = crypto.randomBytes(32).toString('hex');

app.use(session({
  name: 'connect.sid', // add this explicitly
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true
  }
}));

// ----- DB CONNECTION (hard-coded) -----
const db = mysql.createConnection({
  host: 'localhost',      // <-- your MySQL host
  user: 'root',           // <-- your MySQL user
  password: '',               // <-- your MySQL password (empty string if none)
  database: 'awas_db',         // <-- your database name
  multipleStatements: true
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err.stack);
    process.exit(1);
  }
  console.log('Connected to MySQL :)');
});

// ----- API ROUTES -----

// Session status (is a session active) 
app.get('/session-status', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// Register
app.post('/register', (req, res) => {
  const { username, password } = req.body;

  // validate username and password
  if (!isValidUsername(username) || !isValidPassword(password)) {
  return res.status(400).send('Invalid username or password format.');
  }

  // Parameterized INSERT
  const sql = `
    INSERT INTO users (username, password, money)
    VALUES (?, ?, 0)
  `;
  db.query(sql, [username.trim(), password.trim()], err => {
    if (err) {
      // duplicate username, etc.
      return res.status(500).send("An unexpected error occured");
    }
    res.status(201).send('User registered');
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // validate username and password
  if (!isValidUsername(username) || !isValidPassword(password)) {
  return res.status(400).send('Invalid username or password format.');
  }

  // Use parameterized query instead of string concatenation
  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      return res.status(500).send("An unexpected error occured");
    }
    if (results.length > 0) {
      // regenerate session to avoid fixation
      req.session.regenerate(err => {
        if (err) return res.status(500).send('Session error');
        req.session.user = results[0].username;
        res.status(200).send('Login successful');
      });
    } else {
      res.status(401).send('Invalid credentials');
    }
  });
});


// LOGOUT – ends the user session
app.post('/logout', (req, res) => {
  // No session? Deny the request
  if (!req.session.user) {
    return res.status(401).send('Not logged in');
  }

  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      // Failed to destroy session
      return res.status(500).send('Server error during logout');
    }

    // Clear session cookie on client
    res.clearCookie('connect.sid', {
      path: '/',        // must match cookie path used in express-session
      httpOnly: true,   // only accessible via HTTP(S), not JS
      secure: false     // true if using HTTPS
    });

    // 204 No Content – logout successful, no body needed
    res.sendStatus(204);
  });
});

// Transfer money
app.get('/transfer', (req, res) => {
  const { from, to, amount } = req.query;

  // Ensure the logged-in user matches the sender
  if (!req.session.user || req.session.user !== from) {
    return res.status(403).send('Unauthorized');
  }

  // Validate input
  if (!from || !to || from === to || isNaN(amt) || amt <= 0) {
    return res.status(400).send('Invalid input');
  }

  const checkSql = `SELECT money FROM users WHERE username='${from}'`;
  db.query(checkSql, (err, results) => {
    if (err) return res.status(500).send("An unexpected error occured");
    if (results.length === 0) return res.status(404).send('Sender not found');
    const balance = results[0].money;
    if (balance < amount) return res.status(400).send('Insufficient funds');

    // Deduct from sender
    const withdrawSql = `
      UPDATE users 
      SET money = money - ${amount} 
      WHERE username = '${from}'
    `;
    db.query(withdrawSql, (err) => {
      if (err) return res.status(500).send("An unexpected error occured");

      // Credit to receiver
      const depositSql = `
        UPDATE users 
        SET money = money + ${amount} 
        WHERE username = '${to}'
      `;
      db.query(depositSql, (err2) => {
        if (err2) return res.status(500).send("An unexpected error occured");
        res.send(`Transferred ${amount} from ${from} to ${to}`);
      });
    });
  });
});

// Get for user balance
app.get('/balance', (req, res) => {
  const { username } = req.query;
  const sql = `SELECT money FROM users WHERE username = '${username}'`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err.message);
    if (results.length === 0) return res.status(404).send('User not found');
    res.json(results);
  });
});

// GET comments
app.get('/comments', (req, res) => {
  const sql = 'SELECT id, username, comment, created_at FROM comments';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send("An unexpected error occured");
    res.json(results);
  });
});

// POST new comment (DB defaults created_at to NOW())
app.post('/comments', (req, res) => {
  const { author, text } = req.body;

  const sql = `
    INSERT INTO comments (username, comment)
    VALUES (?, ?)
  `;

  db.query(sql, [author, text], err => {
    if (err) {
      console.log(err.message);
      return res.status(500).send(err.message);
    }
    res.status(201).send('Comment saved');
  });
});


// Reset Database
app.get('/reset', (req, res) => {
  const sql = fs.readFileSync(path.join(__dirname, 'reset.sql')).toString();
  db.query(sql, err => {
    if (err) return res.status(500).send("An unexpected error occured");
    res.send('Database reset to default state.');
  });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
