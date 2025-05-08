// Gestione WebSocket per il contatore utenti
document.addEventListener('DOMContentLoaded', function() {
    // Connessione al server Socket.IO
    const socket = io();
    
    // Riferimenti a elementi DOM
    const userCounterElement = document.getElementById('online-users-count');
    const userCounterContainer = document.getElementById('online-users-container');
    
    // Se l'elemento non esiste, crealo dinamicamente
    if (!userCounterContainer) {
        const container = document.createElement('div');
        container.id = 'online-users-container';
        container.className = 'fixed top-4 right-4 bg-gray-900 text-white py-2 px-4 rounded-full shadow-lg flex items-center';
        container.innerHTML = `
            <div class="w-3 h-3 bg-green-500 rounded-full mr-2 pulse-animation"></div>
            <span class="mr-1">Online:</span> 
            <span id="online-users-count" class="font-bold">0</span>
        `;
        
        document.body.appendChild(container);
        
        // Aggiungi stile per animazione pulsante
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 0.5; }
                50% { opacity: 1; }
                100% { opacity: 0.5; }
            }
            .pulse-animation {
                animation: pulse 1.5s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Aggiorna il contatore quando riceve aggiornamenti
    socket.on('user-counter-update', (data) => {
        const counterElement = document.getElementById('online-users-count');
        if (counterElement) {
            counterElement.textContent = data.count;
        }
    });
    
    // Invia un heartbeat periodico per mantenere la connessione
    setInterval(() => {
        socket.emit('heartbeat');
    }, 30000);
    
    // Controlla se risponde al heartbeat
    socket.on('heartbeat-response', () => {
        console.log('Connessione al server attiva');
    });
    
    // Gestisci riconnessione
    socket.on('reconnect', () => {
        console.log('Riconnesso al server');
    });
    
    // Gestisci errori
    socket.on('connect_error', (error) => {
        console.error('Errore connessione WebSocket:', error);
    });
});