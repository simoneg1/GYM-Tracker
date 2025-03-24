// create-admin.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Crea una connessione al database
const db = new sqlite3.Database('Database.db');

async function createAdmin() {
    try {
        // Hash della password 'admin'
        const hashedPassword = await bcrypt.hash('admin', 10);
        
        // Prima elimina admin se esiste (per evitare errori di email duplicata)
        db.run('DELETE FROM utenti WHERE email = ?', ['admin@admin.com'], (err) => {
            if (err) {
                console.error('Errore durante la pulizia:', err.message);
                // Continua comunque
            }
            
            console.log('Creazione utente admin in corso...');
            
            // Inserisci l'utente admin con tutti i campi richiesti
            db.run(`
                INSERT INTO utenti (tipo, nome, cognome, eta, peso, altezza, email, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'Admin', 
                'Amministratore', 
                'Sistema', 
                30,  // Età predefinita
                80,  // Peso predefinito (kg)
                180, // Altezza predefinita (cm)
                'admin@admin.com', 
                hashedPassword
            ], function(err) {
                if (err) {
                    console.error('Errore durante la creazione dell\'admin:', err.message);
                } else {
                    console.log('✅ Account admin creato con successo!');
                    console.log('   ID: ' + this.lastID);
                    console.log('   Email: admin@admin.com');
                    console.log('   Password: admin');
                    console.log('   Tipo: Admin');
                }
                
                // Verifica che l'utente esista ora
                db.get('SELECT id, tipo, nome, email, eta, peso, altezza FROM utenti WHERE email = ?', ['admin@admin.com'], (err, row) => {
                    if (err) {
                        console.error('Errore nella verifica:', err.message);
                    } else if (row) {
                        console.log('Verifica: utente trovato nel database');
                        console.log(row);
                    } else {
                        console.error('⚠️ Verifica fallita: utente non trovato dopo l\'inserimento');
                    }
                    
                    // Chiudi la connessione al database
                    db.close();
                });
            });
        });
    } catch (error) {
        console.error('Errore:', error);
        db.close();
    }
}

// Esegui la funzione
createAdmin();