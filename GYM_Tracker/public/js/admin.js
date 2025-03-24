// Carica i dati dell'utente admin e inizializza la dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            window.location.href = '/';
            return;
        }
        
        const user = await response.json();
        
        // Verifica che sia effettivamente un admin
        if (user.tipo !== 'Admin') {
            window.location.href = '/dashboard';
            return;
        }
        
        // Mostra nome nella navbar se non è già visualizzato
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay && !userDisplay.textContent) {
            userDisplay.textContent = `${user.nome} ${user.cognome} (${user.tipo})`;
        }
        
        // Carica statistiche iniziali
        loadUserStats();
        
        // Prima carica degli utenti
        loadUsers();
        
        // Carica esercizi
        loadExercises();
        
        // Carica annunci recenti
        loadRecentAnnouncements();
        
        // Carica informazioni di sistema
        loadSystemInfo();
        
        // Setup pulsanti azioni rapide
        setupQuickActions();
        
    } catch (error) {
        console.error('Errore nel caricamento dei dati admin:', error);
    }
});

// Configurazione pulsanti azioni rapide
function setupQuickActions() {
    document.getElementById('quickAddExercise').addEventListener('click', () => {
        // Nascondi tutte le sezioni e mostra la sezione esercizi
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('exercises').classList.add('active');
        
        // Aggiorna la navigazione attiva
        document.querySelectorAll('.sidebar nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === 'exercises') {
                link.classList.add('active');
            }
        });
        
        // Mostra il form per aggiungere un esercizio
        document.getElementById('exerciseForm').classList.remove('hidden');
    });
    
    document.getElementById('quickAnnouncement').addEventListener('click', () => {
        // Nascondi tutte le sezioni e mostra la sezione annunci
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('announcements').classList.add('active');
        
        // Aggiorna la navigazione attiva
        document.querySelectorAll('.sidebar nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === 'announcements') {
                link.classList.add('active');
            }
        });
        
        // Mostra il form per aggiungere un annuncio
        document.getElementById('announcementForm').classList.remove('hidden');
    });
    
    document.getElementById('quickStats').addEventListener('click', () => {
        // Nascondi tutte le sezioni e mostra la sezione statistiche
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('statistics').classList.add('active');
        
        // Aggiorna la navigazione attiva
        document.querySelectorAll('.sidebar nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === 'statistics') {
                link.classList.add('active');
            }
        });
    });
    
    document.getElementById('quickUserManagement').addEventListener('click', () => {
        // Nascondi tutte le sezioni e mostra la sezione utenti
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById('users').classList.add('active');
        
        // Aggiorna la navigazione attiva
        document.querySelectorAll('.sidebar nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === 'users') {
                link.classList.add('active');
            }
        });
    });
}

// Carica statistiche utenti
async function loadUserStats() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) return;
        
        const users = await response.json();
        
        // Calcola statistiche
        const totalUsers = users.length;
        const athletes = users.filter(u => u.tipo === 'Atleta').length;
        const trainers = users.filter(u => u.tipo === 'Personal Trainer').length;
        
        // Mostra statistiche
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalAthletes').textContent = athletes;
        document.getElementById('totalTrainers').textContent = trainers;
        
        // Carica conteggio esercizi
        try {
            const exercisesResponse = await fetch('/api/exercises');
            if (exercisesResponse.ok) {
                const exercises = await exercisesResponse.json();
                document.getElementById('totalExercises').textContent = exercises.length;
            }
        } catch (error) {
            console.error('Errore caricamento statistiche esercizi:', error);
            document.getElementById('totalExercises').textContent = '-';
        }
        
    } catch (error) {
        console.error('Errore caricamento statistiche:', error);
    }
}

// Carica lista utenti
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) return;
        
        const users = await response.json();
        const tableBody = document.getElementById('usersTableBody');
        tableBody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nome}</td>
                <td>${user.cognome}</td>
                <td>${user.email}</td>
                <td>${user.tipo}</td>
                <td class="actions">
                    ${user.tipo !== 'Admin' ? 
                        `<button class="promote-btn" data-id="${user.id}">Promuovi</button>` : 
                        '<span class="admin-badge">Admin</span>'}
                    ${user.email !== 'admin@admin.com' ? 
                        `<button class="delete-btn" data-id="${user.id}">Elimina</button>` : 
                        ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Aggiungi event listener ai pulsanti
        document.querySelectorAll('.promote-btn').forEach(btn => {
            btn.addEventListener('click', promoteUser);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteUser);
        });
        
    } catch (error) {
        console.error('Errore caricamento utenti:', error);
    }
}

// Carica lista esercizi
async function loadExercises() {
    try {
        const response = await fetch('/api/exercises');
        if (!response.ok) return;
        
        const exercises = await response.json();
        const tableBody = document.getElementById('exercisesTableBody');
        tableBody.innerHTML = '';
        
        if (exercises.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="center">Nessun esercizio disponibile</td></tr>`;
            return;
        }
        
        exercises.forEach(exercise => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exercise.id}</td>
                <td>${exercise.nome}</td>
                <td>${exercise.categoria}</td>
                <td>${exercise.difficolta || 'N/A'}</td>
                <td>${exercise.creator_name || 'Admin'}</td>
                <td class="actions">
                    <button class="view-btn" data-id="${exercise.id}">Visualizza</button>
                    <button class="delete-btn" data-id="${exercise.id}">Elimina</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Aggiungi event listener ai pulsanti
        document.querySelectorAll('#exercisesTableBody .delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteExercise);
        });
        
        document.querySelectorAll('#exercisesTableBody .view-btn').forEach(btn => {
            btn.addEventListener('click', viewExercise);
        });
        
    } catch (error) {
        console.error('Errore caricamento esercizi:', error);
        document.getElementById('exercisesTableBody').innerHTML = 
            `<tr><td colspan="6" class="center">Errore durante il caricamento degli esercizi</td></tr>`;
    }
}

// Carica annunci recenti
async function loadRecentAnnouncements() {
    try {
        const response = await fetch('/api/announcements');
        if (!response.ok) return;
        
        const announcements = await response.json();
        const recentContainer = document.getElementById('recentAnnouncements');
        const adminList = document.getElementById('adminAnnouncementsList');
        
        if (announcements.length === 0) {
            recentContainer.innerHTML = '<p>Nessun annuncio recente</p>';
            if (adminList) adminList.innerHTML = '<p>Nessun annuncio pubblicato</p>';
            return;
        }
        
        // Mostra solo i primi 3 annunci nella dashboard
        recentContainer.innerHTML = '';
        const recentAnnouncements = announcements.slice(0, 3);
        
        recentAnnouncements.forEach(announcement => {
            const date = new Date(announcement.data).toLocaleDateString('it-IT', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            
            const announcementEl = document.createElement('div');
            announcementEl.className = 'activity-item';
            announcementEl.innerHTML = `
                <div class="activity-header">
                    <h4>${announcement.titolo}</h4>
                    <span class="activity-date">${date}</span>
                </div>
                <p>${announcement.messaggio}</p>
            `;
            recentContainer.appendChild(announcementEl);
        });
        
        // Mostra tutti gli annunci nella sezione dedicata
        if (adminList) {
            adminList.innerHTML = '';
            announcements.forEach(announcement => {
                const date = new Date(announcement.data).toLocaleDateString('it-IT', {
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit'
                });
                
                const announcementEl = document.createElement('div');
                announcementEl.className = 'announcement-item';
                announcementEl.innerHTML = `
                    <div class="announcement-header">
                        <h4>${announcement.titolo}</h4>
                        <span class="announcement-date">${date}</span>
                    </div>
                    <p>${announcement.messaggio}</p>
                    <div class="announcement-footer">
                        <span class="announcement-author">Pubblicato da: ${announcement.admin_name || 'Admin'}</span>
                        <button class="delete-btn" data-id="${announcement.id}">Elimina</button>
                    </div>
                `;
                adminList.appendChild(announcementEl);
            });
            
            // Aggiungi event listener per eliminare annunci
            document.querySelectorAll('#adminAnnouncementsList .delete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    alert('Funzionalità di eliminazione annunci in fase di sviluppo');
                });
            });
        }
        
    } catch (error) {
        console.error('Errore caricamento annunci:', error);
        document.getElementById('recentAnnouncements').innerHTML = '<p>Errore durante il caricamento degli annunci</p>';
        if (document.getElementById('adminAnnouncementsList')) {
            document.getElementById('adminAnnouncementsList').innerHTML = '<p>Errore durante il caricamento degli annunci</p>';
        }
    }
}

// Carica informazioni di sistema
async function loadSystemInfo() {
    try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) return;
        
        const data = await response.json();
        const systemInfo = document.getElementById('systemInfo');
        
        if (!data.success) {
            systemInfo.innerHTML = '<p>Errore durante il caricamento delle informazioni di sistema</p>';
            return;
        }
        
        // Formatta uptime
        const uptime = data.systemInfo.uptime;
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        systemInfo.innerHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Versione:</span>
                    <span class="info-value">${data.systemInfo.version}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Uptime:</span>
                    <span class="info-value">${uptimeFormatted}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Node Version:</span>
                    <span class="info-value">${data.systemInfo.nodeVersion}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Piattaforma:</span>
                    <span class="info-value">${data.systemInfo.platform}</span>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Errore caricamento info sistema:', error);
        document.getElementById('systemInfo').innerHTML = '<p>Errore durante il caricamento delle informazioni di sistema</p>';
    }
}

// Promuovi utente ad admin
async function promoteUser(e) {
    const userId = e.target.getAttribute('data-id');
    if (!confirm(`Sei sicuro di voler promuovere l'utente ID ${userId} ad amministratore?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}/promote`, {
            method: 'POST'
        });
        
        if (response.ok) {
            alert('Utente promosso ad Admin con successo!');
            loadUsers(); // Ricarica la lista utenti
            loadUserStats(); // Aggiorna statistiche
        } else {
            const data = await response.json();
            alert(`Errore: ${data.message}`);
        }
    } catch (error) {
        console.error('Errore promozione:', error);
        alert('Errore di connessione');
    }
}

// Elimina utente
async function deleteUser(e) {
    const userId = e.target.getAttribute('data-id');
    if (!confirm(`Sei sicuro di voler eliminare l'utente ID ${userId}? Questa azione è irreversibile.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Utente eliminato con successo!');
            loadUsers(); // Ricarica la lista utenti
            loadUserStats(); // Aggiorna statistiche
        } else {
            const data = await response.json();
            alert(`Errore: ${data.message}`);
        }
    } catch (error) {
        console.error('Errore eliminazione:', error);
        alert('Errore di connessione');
    }
}

// Elimina esercizio
async function deleteExercise(e) {
    const exerciseId = e.target.getAttribute('data-id');
    if (!confirm(`Sei sicuro di voler eliminare l'esercizio ID ${exerciseId}? Questa azione è irreversibile.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/exercises/${exerciseId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Esercizio eliminato con successo!');
            loadExercises(); // Ricarica la lista esercizi
            loadUserStats(); // Aggiorna statistiche
        } else {
            const data = await response.json();
            alert(`Errore: ${data.message}`);
        }
    } catch (error) {
        console.error('Errore eliminazione:', error);
        alert('Errore di connessione');
    }
}

// Visualizza dettagli esercizio
function viewExercise(e) {
    const exerciseId = e.target.getAttribute('data-id');
    alert(`Visualizzazione dettagli esercizio ID ${exerciseId} - Funzionalità in fase di sviluppo`);
}

// Gestione navigazione tra sezioni
document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Rimuovi classe active da tutti i link
        document.querySelectorAll('.sidebar nav a').forEach(navLink => {
            navLink.classList.remove('active');
        });
        
        // Aggiungi classe active al link cliccato
        link.classList.add('active');
        
        // Nascondi tutte le sezioni
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Mostra la sezione corrispondente
        const targetSection = document.getElementById(link.getAttribute('data-section'));
        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
});

// Aggiorna lista utenti
document.getElementById('refreshUsersBtn').addEventListener('click', () => {
    loadUsers();
    loadUserStats();
});

// Gestione form esercizi
document.getElementById('addExerciseBtn').addEventListener('click', () => {
    document.getElementById('exerciseForm').classList.remove('hidden');
});

document.getElementById('cancelExerciseBtn').addEventListener('click', () => {
    document.getElementById('exerciseForm').classList.add('hidden');
    // Reset form
    document.getElementById('exerciseName').value = '';
    document.getElementById('exerciseCategory').selectedIndex = 0;
    document.getElementById('exerciseDifficulty').selectedIndex = 0;
    document.getElementById('exerciseDescription').value = '';
});

document.getElementById('saveExerciseBtn').addEventListener('click', async () => {
    const nome = document.getElementById('exerciseName').value;
    const categoria = document.getElementById('exerciseCategory').value;
    const difficolta = document.getElementById('exerciseDifficulty').value;
    const descrizione = document.getElementById('exerciseDescription').value;
    
    if (!nome || !categoria) {
        alert('Nome e categoria sono campi obbligatori');
        return;
    }
    
    try {
        const response = await fetch('/api/exercises', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome,
                categoria,
                difficolta,
                descrizione
            })
        });
        
        if (response.ok) {
            alert('Esercizio aggiunto con successo!');
            // Reset form e nascondi
            document.getElementById('exerciseName').value = '';
            document.getElementById('exerciseCategory').selectedIndex = 0;
            document.getElementById('exerciseDifficulty').selectedIndex = 0;
            document.getElementById('exerciseDescription').value = '';
            document.getElementById('exerciseForm').classList.add('hidden');
            
            // Ricarica lista esercizi
            loadExercises();
            loadUserStats();
        } else {
            const data = await response.json();
            alert(`Errore: ${data.message}`);
        }
    } catch (error) {
        console.error('Errore salvataggio esercizio:', error);
        alert('Errore di connessione');
    }
});

document.getElementById('refreshExercisesBtn').addEventListener('click', loadExercises);

// Gestione form annunci
document.getElementById('addAnnouncementBtn').addEventListener('click', () => {
    document.getElementById('announcementForm').classList.remove('hidden');
});

document.getElementById('cancelAnnouncementBtn').addEventListener('click', () => {
    document.getElementById('announcementForm').classList.add('hidden');
    // Reset form
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementMessage').value = '';
});

document.getElementById('saveAnnouncementBtn').addEventListener('click', async () => {
    const titolo = document.getElementById('announcementTitle').value;
    const messaggio = document.getElementById('announcementMessage').value;
    
    if (!titolo || !messaggio) {
        alert('Titolo e messaggio sono campi obbligatori');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/announcements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                titolo,
                messaggio
            })
        });
        
        if (response.ok) {
            alert('Annuncio pubblicato con successo!');
            // Reset form e nascondi
            document.getElementById('announcementTitle').value = '';
            document.getElementById('announcementMessage').value = '';
            document.getElementById('announcementForm').classList.add('hidden');
            
            // Ricarica annunci
            loadRecentAnnouncements();
        } else {
            const data = await response.json();
            alert(`Errore: ${data.message}`);
        }
    } catch (error) {
        console.error('Errore pubblicazione annuncio:', error);
        alert('Errore di connessione');
    }
});

// Gestione pulsanti sistema
document.getElementById('backupBtn').addEventListener('click', () => {
    alert('Funzionalità di backup in fase di sviluppo');
});

document.getElementById('clearCacheBtn').addEventListener('click', () => {
    alert('Funzionalità di pulizia cache in fase di sviluppo');
});

document.getElementById('resetDbBtn').addEventListener('click', () => {
    if (confirm('ATTENZIONE: Questa azione resetterà tutto il database. Tutti i dati verranno persi. Sei sicuro di voler continuare?')) {
        alert('Funzionalità di reset database in fase di sviluppo');
    }
});

// Gestione logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Errore durante il logout:', error);
    }
});