document.addEventListener('DOMContentLoaded', () => {
    // Gestione della navigazione a tab
    const navLinks = document.querySelectorAll('.sidebar nav a');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Rimuovi classe active da tutti i link
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            
            // Aggiungi classe active al link cliccato
            link.classList.add('active');
            
            // Nascondi tutte le sezioni
            sections.forEach(section => section.classList.remove('active'));
            
            // Mostra la sezione corrispondente
            const targetSection = document.getElementById(link.getAttribute('data-section'));
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
    
    // Gestione del logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    alert('Errore durante il logout. Riprova.');
                }
            } catch (error) {
                console.error('Errore durante il logout:', error);
                alert('Errore di connessione. Riprova.');
            }
        });
    }
    
    // Aggiornamento profilo (placeholder - da implementare)
    const updateBtn = document.querySelector('.update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            alert('Funzionalità di aggiornamento del profilo non ancora implementata.');
        });
    }
});