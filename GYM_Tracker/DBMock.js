class DBMock {
    constructor() {
        // Inizializza il "database" come un array in memoria
        this.users = [
            { 
                id: 1, 
                tipo: 'Atleta', 
                nome: 'John', 
                cognome: 'Doe', 
                eta: 30, 
                peso: 70.5, 
                altezza: 175, 
                email: 'jdoe@example.com', 
                password: '123456' 
            },
            { 
                id: 2, 
                tipo: 'Personal Trainer', 
                nome: 'Alice', 
                cognome: 'Smith', 
                eta: 28, 
                peso: 60.0, 
                altezza: 165, 
                email: 'asmith@example.com', 
                password: 'abcdef' 
            },
        ];
        this.nextId = this.users.length ? this.users[this.users.length - 1].id + 1 : 1; // Generatore ID
    }

    // Ottieni tutti gli utenti
    getAllUsers() {
        return this.users.map(user => ({ ...user, password: undefined })); // Escludi la password
    }

    // Ottieni un utente per ID
    getUserById(id) {
        const user = this.users.find(user => user.id === id);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }

    getUserByUsername(email) {
        return this.users.find(user => user.email === email);
    }

    // Crea un nuovo utente
    createUser({ tipo, nome, cognome, eta, peso, altezza, email, password }) {
        if (!tipo || !nome || !cognome || !eta || !peso || !altezza || !email || !password) {
            throw new Error('Tutti i campi sono obbligatori: tipo, nome, cognome, eta, peso, altezza, email, password');
        }
        const newUser = {
            id: this.nextId++,
            tipo,
            nome,
            cognome,
            eta,
            peso,
            altezza,
            email,
            password,
        };
        this.users.push(newUser);
        return newUser;
    }

    // Aggiorna un utente esistente
    updateUser(id, updates) {
        const user = this.users.find(user => user.id === id);
        if (!user) {
            return null;
        }
        if (updates.tipo) user.tipo = updates.tipo;
        if (updates.nome) user.nome = updates.nome;
        if (updates.cognome) user.cognome = updates.cognome;
        if (updates.eta) user.eta = updates.eta;
        if (updates.peso) user.peso = updates.peso;
        if (updates.altezza) user.altezza = updates.altezza;
        if (updates.email) user.email = updates.email;
        if (updates.password) user.password = updates.password;
        return user;
    }

    // Elimina un utente
    deleteUser(id) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            return false;
        }
        this.users.splice(userIndex, 1);
        return true;
    }
}

module.exports = DBMock;
