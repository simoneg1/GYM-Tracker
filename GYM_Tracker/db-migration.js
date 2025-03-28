// Eseguire questo script per aggiornare la tabella utenti esistente
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('Database.db');

db.run(`
    ALTER TABLE utenti ADD COLUMN googleId TEXT
`, (err) => {
    if (err) {
        // Se l'errore è perché la colonna esiste già, va bene
        if (!err.message.includes('duplicate column name')) {
            console.error('Errore durante l\'aggiornamento della tabella utenti:', err.message);
        } else {
            console.log('La colonna googleId esiste già');
        }
    } else {
        console.log('Tabella utenti aggiornata con successo');
    }
    db.close();
});