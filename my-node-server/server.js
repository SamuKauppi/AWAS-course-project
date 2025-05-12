require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',    // Your database host
    user: 'root',         // Your database user
    password: '',         // Your database password
    database: 'awas_db' // Your database name
});
db.connect(err => {
    if (err) {
        console.error('DB connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL');
});

app.get('/', (req, res) => {
    db.query('SELECT NOW() AS currentTime', (err, results) => {
        if (err) return res.status(500).send('DB error');
        res.send(`Database time: ${results[0].currentTime}`);
    });
});

app.listen(port, () => {
    console.log(`:) Server running on http://localhost:${port}`);
});
