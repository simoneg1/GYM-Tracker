async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    document.getElementById('loginError').style.display = 'none'; // Nasconde il messaggio di errore
    document.getElementById('loginMessage').innerText = ''; // Resetta il messaggio di successo

    if (response.ok) {
        // Reindirizza a una nuova pagina di benvenuto
        window.location.href = `/welcome.html?username=${data.username}`;
    } else {
        document.getElementById('loginError').style.display = 'block'; // Mostra il messaggio di errore
        document.getElementById('loginMessage').innerText = data.message || "Errore durante il login.";
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const tipo = document.getElementById('regTipo').value;
    const password = document.getElementById('regPass').value;
    const response = await fetch('/utenti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, tipo })
    });
    const data = await response.json();
    const regMessage = document.getElementById('regMessage');

    if (response.ok) {
        regMessage.innerText = "Registrazione avvenuta con successo.";
        regMessage.className = "message success";
        setTimeout(toggleForms, 2000);
    } else {
        regMessage.innerText = data.message || "Errore durante la registrazione.";
        regMessage.className = "message error";
    }
}

function toggleForms() {
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    if (loginContainer.style.display === 'none') {
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
    } else {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    }
}