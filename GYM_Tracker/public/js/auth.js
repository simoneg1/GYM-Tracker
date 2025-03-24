document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const loginMessage = document.getElementById('loginMessage');
            loginMessage.className = 'message';
            loginMessage.textContent = 'Effettuando l\'accesso...';
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPass').value;
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    loginMessage.textContent = 'Accesso avvenuto con successo.';
                    loginMessage.className = 'message success';
                    
                    // Reindirizza alla dashboard (il server deciderà quale dashboard mostrare in base al tipo)
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    loginMessage.textContent = data.message || 'Errore durante il login.';
                    loginMessage.className = 'message error';
                }
            } catch (error) {
                console.error('Errore durante il login:', error);
                loginMessage.textContent = 'Errore di connessione. Riprova più tardi.';
                loginMessage.className = 'message error';
            }
        });
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const regMessage = document.getElementById('regMessage');
            regMessage.className = 'message';
            regMessage.textContent = 'Registrazione in corso...';
            
            const formData = {
                tipo: document.getElementById('regTipo').value,
                nome: document.getElementById('regNome').value,
                cognome: document.getElementById('regCognome').value,
                eta: parseInt(document.getElementById('regEta').value, 10),
                peso: parseFloat(document.getElementById('regPeso').value),
                altezza: parseFloat(document.getElementById('regAltezza').value),
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPass').value
            };
            
            // Validazione base
            if (!formData.tipo || !formData.nome || !formData.cognome || !formData.email || !formData.password) {
                regMessage.textContent = 'Tutti i campi obbligatori devono essere compilati.';
                regMessage.className = 'message error';
                return;
            }
            
            if (formData.password.length < 6) {
                regMessage.textContent = 'La password deve contenere almeno 6 caratteri.';
                regMessage.className = 'message error';
                return;
            }
            
            if (isNaN(formData.eta) || isNaN(formData.peso) || isNaN(formData.altezza)) {
                regMessage.textContent = 'Età, peso e altezza devono essere numeri validi.';
                regMessage.className = 'message error';
                return;
            }
            
            try {
                const response = await fetch('/utenti', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    regMessage.textContent = 'Registrazione avvenuta con successo!';
                    regMessage.className = 'message success';
                    
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    regMessage.textContent = data.message || 'Errore durante la registrazione.';
                    regMessage.className = 'message error';
                }
            } catch (error) {
                console.error('Errore durante la registrazione:', error);
                regMessage.textContent = 'Errore di connessione. Riprova più tardi.';
                regMessage.className = 'message error';
            }
        });
    }
    
    // Google login implementation
    const googleLoginBtn = document.getElementById('googleLogin');
    if (googleLoginBtn) {
        // Carica la libreria Google Identity Services
        const loadGoogleScript = () => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            
            script.onload = initGoogleLogin;
        };
        
        const initGoogleLogin = () => {
            // Il tuo Client ID di Google
            const CLIENT_ID = '357728416594-aau29i02m1vs41de0ulajhmueni24mc3.apps.googleusercontent.com';
            
            google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: handleGoogleCallback,
                auto_select: false
            });
            
            // Personalizza il pulsante di login Google
            googleLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('loginMessage').textContent = 'Accesso con Google in corso...';
                google.accounts.id.prompt();
            });
        };
        
        // Callback che gestisce la risposta di Google
        const handleGoogleCallback = async (response) => {
            const loginMessage = document.getElementById('loginMessage');
            loginMessage.className = 'message';
            loginMessage.textContent = 'Autenticazione con Google in corso...';
            
            try {
                // Invia il token ID al server per la verifica
                const serverResponse = await fetch('/auth/google', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: response.credential })
                });
                
                const data = await serverResponse.json();
                
                if (serverResponse.ok) {
                    loginMessage.textContent = 'Accesso con Google avvenuto con successo!';
                    loginMessage.className = 'message success';
                    
                    // Reindirizza alla dashboard
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    loginMessage.textContent = data.message || 'Errore durante il login con Google.';
                    loginMessage.className = 'message error';
                }
            } catch (error) {
                console.error('Errore durante il login con Google:', error);
                loginMessage.textContent = 'Errore di connessione. Riprova più tardi.';
                loginMessage.className = 'message error';
            }
        };
        
        // Carica lo script di Google all'avvio
        loadGoogleScript();
    }
    
    // Verifico se sono nella pagina dashboard utente
    const updateProfileBtn = document.querySelector('.update-profile-btn');
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', async () => {
            const profileMessage = document.getElementById('profileMessage');
            profileMessage.className = 'message';
            profileMessage.textContent = 'Aggiornamento in corso...';
            
            try {
                const userData = {
                    nome: document.getElementById('profileNome').value,
                    cognome: document.getElementById('profileCognome').value,
                    eta: parseInt(document.getElementById('profileEta').value, 10),
                    peso: parseFloat(document.getElementById('profilePeso').value),
                    altezza: parseFloat(document.getElementById('profileAltezza').value)
                };
                
                const response = await fetch('/api/user', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    profileMessage.textContent = 'Profilo aggiornato con successo!';
                    profileMessage.className = 'message success';
                } else {
                    profileMessage.textContent = data.message || 'Errore durante l\'aggiornamento.';
                    profileMessage.className = 'message error';
                }
            } catch (error) {
                console.error('Errore durante l\'aggiornamento:', error);
                profileMessage.textContent = 'Errore di connessione. Riprova più tardi.';
                profileMessage.className = 'message error';
            }
        });
    }
    
    // Cambio password
    const updatePasswordBtn = document.querySelector('.update-password-btn');
    if (updatePasswordBtn) {
        updatePasswordBtn.addEventListener('click', async () => {
            const passwordMessage = document.getElementById('passwordMessage');
            passwordMessage.className = 'message';
            passwordMessage.textContent = 'Aggiornamento password in corso...';
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (!currentPassword || !newPassword || !confirmPassword) {
                passwordMessage.textContent = 'Tutti i campi sono obbligatori.';
                passwordMessage.className = 'message error';
                return;
            }
            
            if (newPassword.length < 6) {
                passwordMessage.textContent = 'La nuova password deve contenere almeno 6 caratteri.';
                passwordMessage.className = 'message error';
                return;
            }
            
            if (newPassword !== confirmPassword) {
                passwordMessage.textContent = 'Le password non coincidono.';
                passwordMessage.className = 'message error';
                return;
            }
            
            try {
                const response = await fetch('/api/user/password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    passwordMessage.textContent = 'Password aggiornata con successo!';
                    passwordMessage.className = 'message success';
                    
                    // Reset dei campi
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                } else {
                    passwordMessage.textContent = data.message || 'Errore durante l\'aggiornamento.';
                    passwordMessage.className = 'message error';
                }
            } catch (error) {
                console.error('Errore durante l\'aggiornamento:', error);
                passwordMessage.textContent = 'Errore di connessione. Riprova più tardi.';
                passwordMessage.className = 'message error';
            }
        });
    }
});