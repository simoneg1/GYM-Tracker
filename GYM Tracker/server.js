const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const PORT = 3000;

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connessione al database SQLite
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error('Errore durante l\'apertura del database:', err.message);
    } else {
        console.log('Connesso al database SQLite.');

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS utenti (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                tipo TEXT NOT NULL
            )`, (err) => {
                if (err) {
                    console.error('Errore durante la creazione della tabella utenti:', err.message);
                } else {
                    console.log('Tabella utenti creata o già esistente.');
                }
            });
        });
    }
});

// Route per il login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Richiesta di login per l'email ${email}`);

    const query = `SELECT * FROM utenti WHERE email = ? AND password = ?`;

    db.get(query, [email, password], (err, row) => {
        if (err) {
            res.status(500).json({ message: 'Errore durante la lettura del database' });
        } else if (row) {
            res.status(200).json({
                "username": row.username,
                "status": "Logged In"
            });
        } else {
            res.status(401).json({ message: 'Credenziali non valide.' });
        }
    });
});

// Route per creare un nuovo utente
app.post('/utenti', (req, res) => {
    const { username, email, password, tipo } = req.body;

    if (!username || !email || !password || !tipo) {
        return res.status(400).json({ message: 'Dati mancanti: username, email, password o tipo di account' });
    }

    const queryCheck = `SELECT * FROM utenti WHERE email = ?`;

    db.get(queryCheck, [email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Errore durante la verifica dell\'email nel database' });
        }
        if (row) {
            return res.status(400).json({ message: 'Email già esistente. Scegli un\'altra email.' });
        }

        const queryInsert = `INSERT INTO utenti (username, email, password, tipo) VALUES (?, ?, ?, ?)`;

        db.run(queryInsert, [username, email, password, tipo], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Errore durante l\'inserimento del nuovo utente nel database' });
            }
            res.status(201).json({ username: username, status: "Registered In" });
        });
    });
});

// Route per ottenere tutti gli utenti (opzionale)
app.get('/utenti', (req, res) => {
    const query = `SELECT * FROM utenti`;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Errore durante la lettura del database' });
        } else {
            res.status(200).json(rows);
        }
    });
});

// Route per eliminare un utente (opzionale)
app.delete('/utenti', (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Dati mancanti: username' });
    }

    const query = `DELETE FROM utenti WHERE username = ?`;

    db.run(query, [username], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'utente dal database' });
        }
        if (this.changes > 0) {
            res.status(200).json({
                "username": username,
                "status": "Utente cancellato"
            });
        } else {
            res.status(404).json({ message: 'Utente non trovato.' });
        }
    });
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});

