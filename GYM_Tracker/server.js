const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const exphbs = require('express-handlebars');
const fs = require('fs');
const swaggerApi = require('./swagger');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const dotenv = require('dotenv');

// Carica le variabili d'ambiente
dotenv.config();

const app = express();
const port = 3000;

// Funzione per preparare il database in modo sicuro
const prepareDatabase = async () => {
    return new Promise((resolve, reject) => {
        console.log("Inizializzazione database...");
        const db = new sqlite3.Database('Database.db');

        // Prima verifichiamo e creiamo/modifichiamo la tabella utenti
        db.serialize(() => {
            // Crea tabella utenti se non esiste
            db.run(`
                CREATE TABLE IF NOT EXISTS utenti (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tipo TEXT NOT NULL,
                    nome TEXT NOT NULL,
                    cognome TEXT,
                    eta INTEGER,
                    peso REAL,
                    altezza REAL,
                    email TEXT NOT NULL UNIQUE,
                    password TEXT
                )
            `, (err) => {
                if (err) {
                    console.error('Errore durante la creazione della tabella utenti:', err.message);
                    return reject(err);
                }
                console.log('Tabella utenti verificata');

                // Verifichiamo se la colonna googleId esiste
                db.all("PRAGMA table_info(utenti)", (err, rows) => {
                    if (err) {
                        console.error('Errore durante il controllo della struttura tabella:', err.message);
                        return reject(err);
                    }

                    const hasGoogleIdColumn = rows.some(row => row.name === 'googleId');
                    
                    if (!hasGoogleIdColumn) {
                        console.log('Aggiunta colonna googleId alla tabella utenti...');
                        // La colonna non esiste, la aggiungiamo
                        db.run(`ALTER TABLE utenti ADD COLUMN googleId TEXT`, (err) => {
                            if (err) {
                                console.error('Errore durante l\'aggiunta della colonna googleId:', err.message);
                                return reject(err);
                            }
                            console.log('Colonna googleId aggiunta con successo');
                            
                            // Continua con le altre tabelle
                            createOtherTables(db).then(() => resolve(db)).catch(reject);
                        });
                    } else {
                        console.log('Colonna googleId già esistente');
                        // Continua con le altre tabelle
                        createOtherTables(db).then(() => resolve(db)).catch(reject);
                    }
                });
            });
        });
    });
};

// Funzione per creare le altre tabelle
const createOtherTables = (db) => {
    return new Promise((resolve, reject) => {
        // Tabella esercizi
        db.run(`
            CREATE TABLE IF NOT EXISTS esercizi (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                categoria TEXT NOT NULL,
                descrizione TEXT,
                difficolta TEXT,
                creato_da INTEGER,
                data_creazione TEXT,
                FOREIGN KEY(creato_da) REFERENCES utenti(id)
            )
        `, (err) => {
            if (err) {
                console.error('Errore durante la creazione della tabella esercizi:', err.message);
                return reject(err);
            }
            console.log('Tabella esercizi verificata');

            // Tabella annunci
            db.run(`
                CREATE TABLE IF NOT EXISTS annunci (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titolo TEXT NOT NULL,
                    messaggio TEXT NOT NULL,
                    data TEXT NOT NULL,
                    admin_id INTEGER,
                    FOREIGN KEY(admin_id) REFERENCES utenti(id)
                )
            `, (err) => {
                if (err) {
                    console.error('Errore durante la creazione della tabella annunci:', err.message);
                    return reject(err);
                }
                console.log('Tabella annunci verificata');
                resolve();
            });
        });
    });
};

// Inizializza il database prima di configurare l'applicazione
prepareDatabase()
    .then(db => {
        // Configurazione Handlebars
        const hbs = exphbs.create({
            extname: '.hbs',
            defaultLayout: 'main',
            helpers: {
                eq: function(a, b) {
                    return a === b;
                }
            }
        });

        app.use('/api-docs', swaggerApi.serve, swaggerApi.setup);

        // Configurazione motore di template
        app.engine('.hbs', hbs.engine);
        app.set('view engine', '.hbs');
        app.set('views', path.join(__dirname, 'views'));

        // Configurazione middleware di base
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(session({
            secret: process.env.SESSION_SECRET || 'chiave_segreta_sessione',
            resave: true,
            saveUninitialized: false,
            cookie: { maxAge: 86400000 } // 24 ore
        }));

        // Inizializza Passport
        app.use(passport.initialize());
        app.use(passport.session());

        // Middleware per passare dati comuni a tutti i template
        app.use((req, res, next) => {
            res.locals.user = req.session.user || null;
            res.locals.isAdmin = req.session.tipo === 'Admin';
            res.locals.clientId = process.env.GOOGLE_CLIENT_ID;
            next();
        });

        // Debug middleware
        app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            if (req.session && req.session.userId) {
                console.log(`Utente autenticato: ${req.session.email} (${req.session.userId})`);
            }
            next();
        });

        // File statici per CSS, JS, ecc.
        app.use(express.static(path.join(__dirname, 'public')));

        // Serializzazione e deserializzazione dell'utente per Passport
        passport.serializeUser((user, done) => {
            console.log('Serializing user:', user.id);
            done(null, user.id);
        });

        passport.deserializeUser((id, done) => {
            console.log('Deserializing user:', id);
            db.get('SELECT * FROM utenti WHERE id = ?', [id], (err, user) => {
                if (err) {
                    console.error('Errore deserializzazione utente:', err);
                    return done(err);
                }
                if (!user) {
                    console.error('Utente non trovato durante deserializzazione:', id);
                    return done(null, false);
                }
                done(null, user);
            });
        });

      // ============= INIZIO CONFIGURAZIONE GOOGLE OAUTH =============

// Verifica le variabili d'ambiente necessarie
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('ERRORE: Variabili d\'ambiente GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET non configurate.');
    console.error('Per abilitare il login con Google, crea un file .env nella cartella principale');
    console.error('e aggiungi le seguenti variabili:');
    console.error('GOOGLE_CLIENT_ID=il_tuo_client_id');
    console.error('GOOGLE_CLIENT_SECRET=il_tuo_client_secret');
} else {
    console.log('Configurazione Google OAuth: Credenziali trovate, inizializzazione...');
    
    try {
        // Configura la strategia Google OAuth con gestione degli errori
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: 'http://localhost:3000/auth/google/callback',
            passReqToCallback: true
        }, (req, accessToken, refreshToken, profile, done) => {
            console.log('Callback Google OAuth chiamata - Dati profilo ricevuti');
            
            // Estrai l'email dal profilo Google
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            
            if (!email) {
                console.error('Google non ha fornito un\'email');
                return done(new Error('Google non ha fornito un\'email'));
            }
            
            console.log('Profilo Google ricevuto:', {
                id: profile.id,
                email: email,
                nome: profile.name?.givenName || profile.displayName?.split(' ')[0],
                cognome: profile.name?.familyName || (profile.displayName?.split(' ').slice(1).join(' '))
            });
            
            // Prima verifichiamo solo per email, poi aggiorniamo googleId se necessario
            db.get('SELECT * FROM utenti WHERE email = ?', [email], async (err, user) => {
                if (err) {
                    console.error('Errore query database:', err);
                    return done(err);
                }
                
                // Se l'utente esiste già (basato su email)
                if (user) {
                    console.log('Utente esistente trovato:', user.id);
                    // Aggiorna googleId se non impostato
                    if (!user.googleId) {
                        db.run('UPDATE utenti SET googleId = ? WHERE id = ?', [profile.id, user.id], function(err) {
                            if (err) {
                                console.error('Errore aggiornamento googleId:', err);
                                // Non blocchiamo il login se l'aggiornamento fallisce
                            } else {
                                console.log('GoogleId aggiornato per utente:', user.id);
                            }
                        });
                    }
                    return done(null, user);
                } else {
                    // Crea un nuovo utente
                    console.log('Creazione nuovo utente Google');
                    try {
                        // Genera una password casuale
                        const hashedPassword = await bcrypt.hash(Math.random().toString(36).substring(2), 10);
                        
                        // Estrai nome e cognome dal profilo Google
                        const nome = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Utente';
                        const cognome = profile.name?.familyName || 
                                      (profile.displayName?.split(' ').length > 1 ? 
                                      profile.displayName?.split(' ').slice(1).join(' ') : 
                                      'Google');
                        
                        // Valori predefiniti per i campi richiesti dalla dashboard
                        db.run(
                            `INSERT INTO utenti (tipo, nome, cognome, email, password, googleId, eta, peso, altezza) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            ['atleta', nome, cognome, email, hashedPassword, profile.id, 30, 70, 175], // Valori predefiniti
                            function(err) {
                                if (err) {
                                    console.error('Errore inserimento nuovo utente:', err);
                                    return done(err);
                                }
                                
                                const newUserId = this.lastID;
                                console.log('Nuovo utente creato, ID:', newUserId);
                                
                                // Recupera l'utente appena creato
                                db.get('SELECT * FROM utenti WHERE id = ?', [newUserId], (err, newUser) => {
                                    if (err) {
                                        console.error('Errore recupero nuovo utente:', err);
                                        return done(err);
                                    }
                                    if (!newUser) {
                                        console.error('Nuovo utente non trovato dopo creazione');
                                        return done(new Error('Errore creazione utente'));
                                    }
                                    console.log('Nuovo utente recuperato correttamente');
                                    return done(null, newUser);
                                });
                            }
                        );
                    } catch (error) {
                        console.error('Errore durante creazione utente:', error);
                        return done(error);
                    }
                }
            });
        }));
        
        console.log('Strategia Google OAuth configurata correttamente');
    } catch (err) {
        console.error('ERRORE durante la configurazione della strategia Google OAuth:', err);
    }
}

// ======================== ROTTE PER L'AUTENTICAZIONE GOOGLE ========================

// Controllo middleware per verificare se la strategia Google esiste
function checkGoogleStrategy(req, res, next) {
    if (!passport._strategies.google) {
        console.error('Tentativo di accesso all\'autenticazione Google ma la strategia non è configurata');
        req.session.error_message = 'L\'autenticazione con Google non è attualmente disponibile. Contatta l\'amministratore.';
        return res.redirect('/?auth_error=google_unavailable');
    }
    next();
}

// Inizia l'autenticazione Google
app.get('/auth/google', checkGoogleStrategy, (req, res, next) => {
    console.log('Richiesta autenticazione Google ricevuta, reindirizzamento a Google');
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
});

// Callback di Google dopo l'autenticazione
app.get('/auth/google/callback', checkGoogleStrategy, (req, res, next) => {
    console.log('Callback da Google ricevuta, tentativo di autenticazione');
    passport.authenticate('google', { 
        failureRedirect: '/?auth_error=google_failed'
    })(req, res, next);
}, (req, res) => {
    // L'utente è stato autenticato con successo
    if (req.user) {
        // Salva i dati utente nella sessione
        req.session.userId = req.user.id;
        req.session.email = req.user.email;
        req.session.tipo = req.user.tipo;
        req.session.user = req.user;
        
        console.log('Login Google completato, sessione impostata:', {
            id: req.user.id,
            email: req.user.email,
            tipo: req.user.tipo
        });
        
        // Importante: assicurati che la sessione venga salvata prima del reindirizzamento
        req.session.save((err) => {
            if (err) {
                console.error("Errore nel salvataggio della sessione:", err);
                return res.redirect('/?auth_error=session_save_failed');
            }
            
            console.log('Sessione salvata, reindirizzamento alla dashboard');
            return res.redirect('/dashboard');
        });
    } else {
        console.error("Autenticazione Google riuscita ma nessun utente trovato");
        return res.redirect('/?auth_error=user_not_found');
    }
});

// ============= FINE CONFIGURAZIONE GOOGLE OAUTH =============

        // ======================== ROTTE DI BASE ========================

        // Homepage / Login
        app.get('/', (req, res) => {
            // Se l'utente è già loggato, redirect alla dashboard
            if (req.session.userId) {
                return res.redirect('/dashboard');
            }
            res.render('index', {
                title: 'GYM Tracker - Login',
                scripts: ['auth'],
                showGoogleLogin: true // Per mostrare il pulsante di login con Google
            });
        });

        // Pagina di registrazione
        app.get('/register', (req, res) => {
            if (req.session.userId) {
                return res.redirect('/dashboard');
            }
            res.render('register', {
                title: 'GYM Tracker - Registrazione',
                scripts: ['auth'],
                showGoogleLogin: true // Per mostrare il pulsante di registrazione con Google
            });
        });

        // Dashboard
        app.get('/dashboard', (req, res) => {
            // Debug per verificare lo stato della sessione
            console.log("Accesso alla dashboard. Dati sessione:", {
                userId: req.session.userId,
                email: req.session.email,
                tipo: req.session.tipo
            });
            
            // Verifica se l'utente è autenticato
            if (!req.session.userId) {
                console.log("Nessun userId nella sessione, reindirizzamento al login");
                return res.redirect('/');
            }
            
            // Recupera i dati completi dell'utente dal database
            db.get('SELECT * FROM utenti WHERE id = ?', [req.session.userId], (err, user) => {
                if (err) {
                    console.error("Errore nel recupero dei dati utente:", err);
                    req.session.destroy();
                    return res.redirect('/');
                }
                
                if (!user) {
                    console.log("Utente non trovato nel database");
                    req.session.destroy();
                    return res.redirect('/');
                }
                
                console.log("Utente trovato:", user.email, "tipo:", user.tipo);
                
                // Se il tipo è "Admin", mostra la dashboard di amministrazione
                if (user.tipo === 'Admin') {
                    return res.render('admin-dashboard', {
                        title: 'GYM Tracker - Pannello Admin',
                        user: user,
                        scripts: ['admin']
                    });
                }
                
                // Altrimenti mostra la dashboard utente normale
                res.render('dashboard', {
                    title: 'GYM Tracker - Dashboard',
                    user: user,
                    scripts: ['dashboard']
                });
            });
        });

        // ======================== API AUTENTICAZIONE ========================

        // API di registrazione
        app.post('/utenti', async (req, res) => {
            const { tipo, nome, cognome, eta, peso, altezza, email, password } = req.body;
            
            try {
                const hashedPassword = await bcrypt.hash(password, 10);
                
                db.get('SELECT * FROM utenti WHERE email = ?', [email], (err, user) => {
                    if (user) {
                        return res.status(409).json({ message: 'Email già registrata' });
                    }
                    
                    db.run(
                        `INSERT INTO utenti (tipo, nome, cognome, eta, peso, altezza, email, password) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [tipo, nome, cognome, eta, peso, altezza, email, hashedPassword],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ message: 'Errore registrazione: ' + err.message });
                            }
                            
                            req.session.userId = this.lastID;
                            req.session.email = email;
                            req.session.tipo = tipo;
                            
                            res.status(201).json({ 
                                message: 'Utente registrato con successo',
                                id: this.lastID
                            });
                        }
                    );
                });
            } catch (error) {
                res.status(500).json({ message: 'Errore: ' + error.message });
            }
        });

        // Login API
        app.post('/login', async (req, res) => {
            const { email, password } = req.body;
            
            console.log(`Tentativo di login per: ${email}`);
            
            db.get('SELECT * FROM utenti WHERE email = ?', [email], async (err, user) => {
                if (err) {
                    console.error('Errore database:', err.message);
                    return res.status(500).json({ message: 'Errore database' });
                }
                
                if (!user) {
                    console.log('Utente non trovato');
                    return res.status(401).json({ message: 'Email o password non validi' });
                }
                
                console.log(`Utente trovato: ${user.email}, tipo: ${user.tipo}`);
                
                try {
                    const match = await bcrypt.compare(password, user.password);
                    console.log(`Verifica password: ${match ? 'successo' : 'fallita'}`);
                    
                    if (!match) {
                        return res.status(401).json({ message: 'Email o password non validi' });
                    }
                    
                    // Salva l'ID utente e il tipo nella sessione
                    req.session.userId = user.id;
                    req.session.email = email;
                    req.session.tipo = user.tipo;
                    req.session.user = user;
                    
                    console.log(`Login completato, sessione creata per: ${email}, tipo: ${user.tipo}`);
                    
                    res.status(200).json({ 
                        message: 'Login effettuato con successo',
                        tipo: user.tipo
                    });
                } catch (error) {
                    console.error('Errore verifica password:', error);
                    res.status(500).json({ message: 'Errore: ' + error.message });
                }
            });
        });

        // Logout API
        app.post('/logout', (req, res) => {
            req.session.destroy();
            res.status(200).json({ message: 'Logout effettuato con successo' });
        });

        // ======================== API GESTIONE UTENTI ========================

        // API per ottenere i dati dell'utente corrente
        app.get('/api/user', (req, res) => {
            if (!req.session.userId) {
                return res.status(401).json({ message: 'Non autenticato' });
            }
            
            db.get('SELECT id, tipo, nome, cognome, eta, peso, altezza, email FROM utenti WHERE id = ?', 
                [req.session.userId], 
                (err, user) => {
                    if (err || !user) {
                        return res.status(404).json({ message: 'Utente non trovato' });
                    }
                    res.json(user);
                }
            );
        });

        // API per ottenere tutti gli utenti (solo per admin)
        app.get('/api/users', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            db.all('SELECT id, tipo, nome, cognome, email FROM utenti', [], (err, users) => {
                if (err) {
                    return res.status(500).json({ message: 'Errore database' });
                }
                res.json(users);
            });
        });

        // API per eliminare un utente (solo per admin)
        app.delete('/api/users/:id', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const userId = req.params.id;
            
            // Impedisci all'admin di eliminare se stesso
            if (parseInt(userId) === req.session.userId) {
                return res.status(400).json({ message: 'Non puoi eliminare il tuo account admin' });
            }
            
            db.run('DELETE FROM utenti WHERE id = ?', [userId], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Errore eliminazione utente' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Utente non trovato' });
                }
                
                res.json({ message: 'Utente eliminato con successo' });
            });
        });

        // API per promuovere un utente ad admin (solo per admin)
        app.post('/api/users/:id/promote', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const userId = req.params.id;
            
            db.run('UPDATE utenti SET tipo = ? WHERE id = ?', ['Admin', userId], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Errore promozione utente' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Utente non trovato' });
                }
                
                res.json({ message: 'Utente promosso ad admin con successo' });
            });
        });

        // API per aggiornare le informazioni dell'utente
        app.put('/api/user', (req, res) => {
            if (!req.session.userId) {
                return res.status(401).json({ message: 'Non autenticato' });
            }
            
            const { nome, cognome, eta, peso, altezza } = req.body;
            
            db.run(
                'UPDATE utenti SET nome = ?, cognome = ?, eta = ?, peso = ?, altezza = ? WHERE id = ?',
                [nome, cognome, eta, peso, altezza, req.session.userId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Errore aggiornamento profilo' });
                    }
                    
                    res.json({ message: 'Profilo aggiornato con successo' });
                }
            );
        });

        // API per cambiare la password
        app.put('/api/user/password', async (req, res) => {
            if (!req.session.userId) {
                return res.status(401).json({ message: 'Non autenticato' });
            }
            
            const { currentPassword, newPassword } = req.body;
            
            if (!currentPassword || !newPassword) {
                return res.status(400).json({ message: 'Dati mancanti' });
            }
            
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'La nuova password deve contenere almeno 6 caratteri' });
            }
            
            try {
                // Verifica password attuale
                db.get('SELECT password FROM utenti WHERE id = ?', [req.session.userId], async (err, user) => {
                    if (err || !user) {
                        return res.status(500).json({ message: 'Errore del server' });
                    }
                    
                    const match = await bcrypt.compare(currentPassword, user.password);
                    if (!match) {
                        return res.status(401).json({ message: 'Password attuale non corretta' });
                    }
                    
                    // Aggiorna password
                    const hashedPassword = await bcrypt.hash(newPassword, 10);
                    
                    db.run('UPDATE utenti SET password = ? WHERE id = ?', [hashedPassword, req.session.userId], function(err) {
                        if (err) {
                            return res.status(500).json({ message: 'Errore aggiornamento password' });
                        }
                        
                        res.json({ message: 'Password aggiornata con successo' });
                    });
                });
            } catch (error) {
                res.status(500).json({ message: 'Errore: ' + error.message });
            }
        });

        // ======================== API GESTIONE ESERCIZI ========================

        // API per ottenere tutti gli esercizi
        app.get('/api/exercises', (req, res) => {
            db.all(`
                SELECT e.*, u.nome as creator_name 
                FROM esercizi e 
                LEFT JOIN utenti u ON e.creato_da = u.id
            `, [], (err, exercises) => {
                if (err) {
                    return res.status(500).json({ message: 'Errore durante il recupero degli esercizi' });
                }
                
                res.json(exercises);
            });
        });

        // API per ottenere un singolo esercizio
        app.get('/api/exercises/:id', (req, res) => {
            const exerciseId = req.params.id;
            
            db.get(`
                SELECT e.*, u.nome as creator_name 
                FROM esercizi e 
                LEFT JOIN utenti u ON e.creato_da = u.id
                WHERE e.id = ?
            `, [exerciseId], (err, exercise) => {
                if (err) {
                    return res.status(500).json({ message: 'Errore durante il recupero dell\'esercizio' });
                }
                
                if (!exercise) {
                    return res.status(404).json({ message: 'Esercizio non trovato' });
                }
                
                res.json(exercise);
            });
        });

        // API per aggiungere un nuovo esercizio (solo admin)
        app.post('/api/exercises', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const { nome, categoria, descrizione, difficolta } = req.body;
            
            if (!nome || !categoria) {
                return res.status(400).json({ message: 'Nome e categoria sono obbligatori' });
            }
            
            const now = new Date().toISOString();
            
            // Inserisci nuovo esercizio
            db.run(
                `INSERT INTO esercizi (nome, categoria, descrizione, difficolta, creato_da, data_creazione) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [nome, categoria, descrizione, difficolta, req.session.userId, now],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Errore durante l\'aggiunta dell\'esercizio' });
                    }
                    
                    res.status(201).json({
                        success: true,
                        message: 'Esercizio aggiunto con successo',
                        id: this.lastID
                    });
                }
            );
        });

        // API per eliminare un esercizio (solo admin)
        app.delete('/api/exercises/:id', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const exerciseId = req.params.id;
            
            db.run('DELETE FROM esercizi WHERE id = ?', [exerciseId], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Errore eliminazione esercizio' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Esercizio non trovato' });
                }
                
                res.json({ message: 'Esercizio eliminato con successo' });
            });
        });

        // ======================== API GESTIONE ANNUNCI ========================

        // API per ottenere tutti gli annunci
        app.get('/api/announcements', (req, res) => {
            db.all(`
                SELECT a.*, u.nome as admin_name 
                FROM annunci a 
                LEFT JOIN utenti u ON a.admin_id = u.id
                ORDER BY datetime(a.data) DESC
            `, [], (err, announcements) => {
                if (err) {
                    return res.status(500).json({ message: 'Errore durante il recupero degli annunci' });
                }
                
                res.json(announcements);
            });
        });

        // API per pubblicare un nuovo annuncio (solo admin)
        app.post('/api/admin/announcements', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const { titolo, messaggio } = req.body;
            
            if (!titolo || !messaggio) {
                return res.status(400).json({ message: 'Titolo e messaggio sono obbligatori' });
            }
            
            const now = new Date().toISOString();
            
            db.run(
                `INSERT INTO annunci (titolo, messaggio, data, admin_id) 
                VALUES (?, ?, ?, ?)`,
                [titolo, messaggio, now, req.session.userId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ message: 'Errore durante l\'aggiunta dell\'annuncio' });
                    }
                    
                    res.status(201).json({
                        success: true,
                        message: 'Annuncio pubblicato con successo',
                        id: this.lastID
                    });
                }
            );
        });

        // API per eliminare un annuncio (solo admin)
        app.delete('/api/announcements/:id', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const announcementId = req.params.id;
            
            db.run('DELETE FROM annunci WHERE id = ?', [announcementId], function(err) {
                if (err) {
                    return res.status(500).json({ message: 'Errore eliminazione annuncio' });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Annuncio non trovato' });
                }
                
                res.json({ message: 'Annuncio eliminato con successo' });
            });
        });

        // ======================== API STATISTICHE E AMMINISTRAZIONE ========================

        // API per ottenere statistiche avanzate del sistema (solo admin)
        app.get('/api/admin/stats', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const stats = {};
            
            // Query per contare utenti per tipo
            db.all('SELECT tipo, COUNT(*) as count FROM utenti GROUP BY tipo', [], (err, userStats) => {
                if (err) {
                    return res.status(500).json({ message: 'Errore database' });
                }
                
                stats.userStats = userStats;
                
                // Query per contare esercizi per categoria
                db.all('SELECT categoria, COUNT(*) as count FROM esercizi GROUP BY categoria', [], (err, exerciseStats) => {
                    if (err) {
                        return res.status(500).json({ message: 'Errore database' });
                    }
                    
                    stats.exerciseStats = exerciseStats;
                    
                    // Statistiche di sistema
                    res.json({
                        success: true,
                        stats: stats,
                        systemInfo: {
                            version: '1.0.0',
                            uptime: process.uptime(),
                            nodeVersion: process.version,
                            platform: process.platform,
                            memoryUsage: process.memoryUsage(),
                            timestamp: new Date().toISOString()
                        }
                    });
                });
            });
        });

        // API per backup del database (solo admin)
        app.post('/api/admin/backup', (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `backup_${timestamp}.db`;
            const backupPath = path.join(__dirname, 'backups', backupFileName);
            
            // Crea la directory backups se non esiste
            if (!fs.existsSync(path.join(__dirname, 'backups'))) {
                fs.mkdirSync(path.join(__dirname, 'backups'));
            }
            
            db.serialize(() => {
                // Chiudi la connessione prima di fare il backup
                db.close((err) => {
                    if (err) {
                        return res.status(500).json({ message: 'Errore durante la chiusura del database' });
                    }
                    
                    // Copia il file del database
                    fs.copyFile('Database.db', backupPath, (err) => {
                        // Riapri la connessione al database dopo il backup
                        const db = new sqlite3.Database('Database.db');
                        
                        if (err) {
                            return res.status(500).json({ message: 'Errore durante il backup del database' });
                        }
                        
                        res.json({
                            success: true,
                            message: 'Backup creato con successo',
                            filename: backupFileName
                        });
                    });
                });
            });
        });

        // API per risettare il database (solo admin)
        app.post('/api/admin/reset', async (req, res) => {
            if (!req.session.userId || req.session.tipo !== 'Admin') {
                return res.status(403).json({ message: 'Accesso negato' });
            }
            
            // Il reset completo è pericoloso - questa è una versione semplificata
            // che mantiene l'utente admin corrente ma cancella tutti gli altri dati
            
            // Ottieni i dati dell'admin corrente
            db.get('SELECT * FROM utenti WHERE id = ?', [req.session.userId], async (err, admin) => {
                if (err || !admin) {
                    return res.status(500).json({ message: 'Errore durante il recupero dei dati admin' });
                }
                
                // Crea un backup prima del reset
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFileName = `pre_reset_${timestamp}.db`;
                const backupPath = path.join(__dirname, 'backups', backupFileName);
                
                // Crea la directory backups se non esiste
                if (!fs.existsSync(path.join(__dirname, 'backups'))) {
                    fs.mkdirSync(path.join(__dirname, 'backups'));
                }
                
                // Copia il file del database
                fs.copyFileSync('Database.db', backupPath);
                
                // Reset delle tabelle
                db.serialize(() => {
                    // Elimina tutte le tabelle
                    db.run('DELETE FROM annunci');
                    db.run('DELETE FROM esercizi');
                    db.run('DELETE FROM utenti WHERE id != ?', [req.session.userId]);
                    
                    res.json({
                        success: true,
                        message: 'Database resettato con successo. Backup creato prima del reset.',
                        backupFile: backupFileName
                    });
                });
            });
        });

        // ======================== AVVIO SERVER ========================

        // Avvia il server
        app.listen(port, () => {
            console.log(`Server in ascolto sulla porta ${port}`);
            console.log(`Dashboard disponibile su http://localhost:${port}`);
            console.log(`Admin dashboard disponibile per gli amministratori dopo il login`);
            console.log('Documentazione API disponibile su http://localhost:3000/api-docs');
            console.log('Autenticazione Google configurata e pronta');
        });

    })
    .catch(err => {
        console.error('ERRORE CRITICO durante l\'inizializzazione del database:', err);
        console.error('L\'applicazione verrà terminata.');
        process.exit(1);
    });


