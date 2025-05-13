require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',    // Database host
    user: 'root',         // Database user
    password: '',         // Database password
    database: "awas_db"     // Database name
});

db.connect(err => {
    if (err) {
        console.error('DB connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL');
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


app.listen(port, () => {
    console.log(`:) Server running on http://localhost:${port}`);
});
