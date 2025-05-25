const path = require('path');
const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();
const port = 3000;

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
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

// ----- DB CONNECTION (hard-coded) -----
const db = mysql.createConnection({
    host: 'localhost',      // <-- your MySQL host
    user: 'root',           // <-- your MySQL user
    password: '',               // <-- your MySQL password (empty string if none)
    database: 'awas_db'         // <-- your database name
});

db.connect(err => {
    if (err) {
        console.error('DB connection failed:', err.stack);
        process.exit(1);
    }
    console.log('Connected to MySQL :)');
});

// ----- API ROUTES -----

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

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM users
               WHERE username='${username}' AND password='${password}'`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err.message);
        if (results.length) {
            req.session.user = username;
            return res.status(200).send('Login successful');
        }
        res.status(401).send('Login failed');
    });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send('Logout failed');
        res.clearCookie('connect.sid');
        res.send('Logged out');
    });
});

// Transfer
app.post('/transfer', (req, res) => {
  const { from, to, amount } = req.body;

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



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
