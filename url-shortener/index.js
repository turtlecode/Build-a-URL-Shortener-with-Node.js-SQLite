const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { nanoid } = require('nanoid');
const app = express();
const PORT = 3000;

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run('CREATE TABLE urls (id INTEGER PRIMARY KEY, shortCode TEXT, originalUrl TEXT)');
});

// Middleware to parse JSON
app.use(express.json());

// Serve static files (HTML frontend)
app.use(express.static('public'));

// URL Shortening
app.post('/shorten', (req, res) => {
    let { url } = req.body;

    // Add 'https://' if missing
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    // Check if URL already exists
    db.get('SELECT shortCode FROM urls WHERE originalUrl = ?', [url], (err, row) => {
        if (row) {
            res.json({ shortUrl: `http://localhost:${PORT}/${row.shortCode}` });
        } else {
            const shortCode = nanoid(6);
            db.run('INSERT INTO urls (shortCode, originalUrl) VALUES (?, ?)', [shortCode, url], (err) => {
                if (err) return res.status(500).send('Database error');
                res.json({ shortUrl: `http://localhost:${PORT}/${shortCode}` });
            });
        }
    });
});

// Redirect to original URL
app.get('/:shortCode', (req, res) => {
    const { shortCode } = req.params;
    db.get('SELECT originalUrl FROM urls WHERE shortCode = ?', [shortCode], (err, row) => {
        if (row) {
            res.redirect(row.originalUrl);
        } else {
            res.status(404).send('URL not found');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});