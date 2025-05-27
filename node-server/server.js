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

// WhoAmI endpoint to prevent logout on refresh
app.get('/whoami', (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user });
  } else {
    res.status(401).json({ username: null });
  }
});

// Register
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const sql = `INSERT INTO users (username, password, money)
               VALUES ('${username}', '${password}', 0)`;
  db.query(sql, err => {
    if (err) return res.status(500).send(err.message);
    res.status(201).send('User registered');
  });
});

// Session status (is a session active)
app.get('/session-status', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// LOGIN – vulnerable version (no password hashing, SQL injection possible)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Build SQL query – vulnerable to SQL injection
  const sql = `SELECT * FROM users
               WHERE username='${username}' AND password='${password}'`;

  // Query the DB
  db.query(sql, (err, results) => {
    if (err) {
      // DB error (e.g. connection failure)
      return res.status(500).send(err.message);
    }

    if (results.length) {
      // User found – store user session
      req.session.user = username;
      return res.status(200).send('Login successful');
    }

    // No match found – bad credentials
    res.status(401).send('Invalid username or password');
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

  const checkSql = `SELECT money FROM users WHERE username='${from}'`;
  db.query(checkSql, (err, results) => {
    if (err) return res.status(500).send(err.message);
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
      if (err) return res.status(500).send(err.message);

      // Credit to receiver
      const depositSql = `
        UPDATE users 
        SET money = money + ${amount} 
        WHERE username = '${to}'
      `;
      db.query(depositSql, (err2) => {
        if (err2) return res.status(500).send(err2.message);
        res.send(`Transferred ${amount} from ${from} to ${to}`);
      });
    });
  });
});

// Get for user balance, test
app.get('/balance', (req, res) => {
  const { username } = req.query;
  const sql = `SELECT money FROM users WHERE username = ?`;
  db.query(sql, [username], (err, results) => {
    if (err) return res.status(500).send(err.message);
    if (results.length === 0) return res.status(404).send('User not found');
    res.json({ money: results[0].money });
  });
});

// GET comments (now including timestamp)
app.get('/comments', (req, res) => {
  const sql = 'SELECT id, username, comment, created_at FROM comments';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.json(results);
  });
});

// POST new comment (DB defaults created_at to NOW())
app.post('/comments', (req, res) => {
  const { author, text } = req.body;
  const sql = `
    INSERT INTO comments (username, comment)
    VALUES ('${author}', '${text}')
  `;
  db.query(sql, err => {
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
    if (err) return res.status(500).send(err.message);
    res.send('Database reset to default state.');
  });
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
