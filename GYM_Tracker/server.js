const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const sqlite3 = require('sqlite3').verbose();



//const mock = require('./DBMock.js');

//const db = new mock();


//const DBMock = require('./DBMock.js');

const app = express();
const port = 3001;

// Configurazione middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connessione al database SQLite
const db = new sqlite3.Database('Database.db', (err) => {
    if (err) {
        console.error('Errore durante l\'apertura del database:', err.message);
    } else {
        console.log('Connesso al database SQLite.');

        // Creazione tabella utenti
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS utenti (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo TEXT NOT NULL,
                    nome TEXT NOT NULL,
                    cognome TEXT NOT NULL,
                    eta INTEGER NOT NULL,
                    peso REAL NOT NULL,
                    altezza REAL NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL
                )
            `, (err) => {
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

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e password sono obbligatorie.' });
    }

    const query = `SELECT * FROM utenti WHERE email = ? AND password = ?`;
    db.get(query, [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Errore durante il login.' });
        }
        if (row) {
            return res.status(200).json({ email: row.email, message: 'Login riuscito!' });
        } else {
            return res.status(401).json({ message: 'Credenziali non valide.' });
        }
    });
});

// Route per la registrazione
app.post('/utenti', (req, res) => {
    const { tipo, nome, cognome, eta, peso, altezza, email, password } = req.body;

    if (!tipo || !nome || !cognome || !eta || !peso || !altezza || !email || !password) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori.' });
    }

    const queryCheck = `SELECT * FROM utenti WHERE email = ?`;
    db.get(queryCheck, [email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Errore durante la verifica dell\'email nel database.' });
        }
        if (row) {
            return res.status(400).json({ message: 'Email già registrata. Scegli un\'altra email.' });
        }

        const queryInsert = `
            INSERT INTO utenti (tipo, nome, cognome, eta, peso, altezza, email, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(queryInsert, [tipo, nome, cognome, eta, peso, altezza, email, password], function (err) {
            if (err) {
                return res.status(500).json({ message: 'Errore durante l\'inserimento nel database.' });
            }
            res.status(201).json({ message: 'Registrazione completata con successo!' });
        });
    });
});

// Route opzionale per ottenere tutti gli utenti
app.get('/utenti', (req, res) => {
    const query = `SELECT * FROM utenti`;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Errore durante la lettura del database.' });
        }
        res.status(200).json(rows);
    });
});

// Route opzionale per eliminare un utente
app.delete('/utenti', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email è obbligatoria per eliminare un utente.' });
    }

    const query = `DELETE FROM utenti WHERE email = ?`;
    db.run(query, [email], function (err) {
        if (err) {
            return res.status(500).json({ message: 'Errore durante l\'eliminazione dell\'utente.' });
        }
        if (this.changes > 0) {
            res.status(200).json({ message: 'Utente eliminato con successo.' });
        } else {
            res.status(404).json({ message: 'Utente non trovato.' });
        }
    });
});

// Avvio del server
app.listen(port, () => {
    console.log(`Server in esecuzione su http://localhost:${port}`);
});




