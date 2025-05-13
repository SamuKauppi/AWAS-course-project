require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

// MySQL connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,          // Database host
    user: process.env.DB_USER,          // Database user
    password: process.env.DB_PASS,      // Database password
    database: process.env.DB_NAME       // Database name
});

db.connect(err => {
    if (err) {
        console.error('DB connection failed:', err.stack);
        return;
    }
    console.log('Connected to database');
});

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const money = 0;

    const sql = `INSERT INTO users (username, password, money) VALUES ('${username}', '${password}', ${money})`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err.message);
        res.send('User registered');
    });
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err.message);

        if (results.length > 0) {
            req.session.user = username;
            return res.status(200).send('Login successful');
        } else {
            return res.status(401).send('Login failed');
        }
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err)
        {
            return res.status(500).send('Could not log out');
        }
        res.clearCookie('connect.sid');
        res.status(200).send('Logged out');
    });
});


app.listen(port, () => {
    console.log(`:) Server running on http://localhost:${port}`);
});
