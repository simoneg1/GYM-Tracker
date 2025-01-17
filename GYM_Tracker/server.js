const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
dotenv.config();

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configurazione credenziali Google
const CLIENT_ID = process.env.CLIENT_ID; // Inserire il client ID nelle variabili d'ambiente
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Inserire il client secret nelle variabili d'ambiente
const REDIRECT_URI = 'http://localhost:3000/auth/callback';

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Connessione al database SQLite
const db = new sqlite3.Database('Database.db', (err) => {
    if (err) {
        console.error('Errore durante l\'apertura del database:', err.message);
    } else {
        console.log('Connesso al database SQLite.');
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS utenti (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo TEXT NOT NULL,
                    nome TEXT NOT NULL,
                    cognome TEXT,
                    email TEXT NOT NULL UNIQUE,
                    google_id TEXT,
                    token TEXT
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

// Route: Redirect URI di callback
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Codice di autorizzazione mancante.');
    }

    try {
        // Scambio del codice per un token di accesso
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Verifica dell'identità dell'utente
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        // Controlla se l'utente esiste nel database
        db.get(`SELECT * FROM utenti WHERE email = ?`, [email], (err, row) => {
            if (err) {
                return res.status(500).send('Errore durante l\'interrogazione del database.');
            }

            if (row) {
                // Utente esiste, aggiorna token
                db.run(
                    `UPDATE utenti SET token = ? WHERE email = ?`,
                    [tokens.access_token, email],
                    (err) => {
                        if (err) {
                            return res.status(500).send('Errore durante l\'aggiornamento del token.');
                        }
                        res.redirect(`/welcome.html?email=${email}`);
                    }
                );
            } else {
                // Nuovo utente, registrazione
                const nome = name.split(' ')[0];
                const cognome = name.split(' ')[1] || '';
                db.run(
                    `INSERT INTO utenti (tipo, nome, cognome, email, google_id, token) VALUES (?, ?, ?, ?, ?, ?)`,
                    ['Google', nome, cognome, email, googleId, tokens.access_token],
                    (err) => {
                        if (err) {
                            return res.status(500).send('Errore durante la registrazione dell\'utente.');
                        }
                        res.redirect(`/welcome.html?email=${email}`);
                    }
                );
            }
        });
    } catch (error) {
        console.error('Errore durante il flusso OAuth:', error);
        res.status(500).send('Errore durante il login.');
    }
});

// Route opzionale: Elenco degli utenti
app.get('/utenti', (req, res) => {
    db.all(`SELECT * FROM utenti`, [], (err, rows) => {
        if (err) {
            return res.status(500).send('Errore durante la lettura del database.');
        }
        res.status(200).json(rows);
    });
});

// Route opzionale: Eliminazione di un utente
app.delete('/utenti', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email è obbligatoria per eliminare un utente.' });
    }

    db.run(`DELETE FROM utenti WHERE email = ?`, [email], function (err) {
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


