# GYM-Tracker
 Ottimizza i tuoi allenamenti e tieni traccia dei tuo progressi grazie ai nostri personal trainer.

LOGIN ATLETA.
Richiesta:
{
  "username": "atletaEsempio",
  "password": "passwordAtleta123",
  "accountType": "atleta"
}
Risposta:
{
  "success": true,
  "message": "Login effettuato con successo!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "atletaEsempio",
    "email": "atleta@dominio.com",
    "accountType": "atleta"
  }
}
LOGIN PERSONAL TRAINER.
Richiesta:
{
  "username": "trainerEsempio",
  "password": "passwordTrainer123",
  "accountType": "trainer"
}
Risposta:
{
  "success": true,
  "message": "Login effettuato con successo!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "trainerEsempio",
    "email": "trainer@dominio.com",
    "accountType": "trainer"
  }
}

REGISTRARE UN ALLENAMENTO.
Richiesta:
{
  "userId": 1,
  "dataAllenamento": "2024-09-27",
  "tipoEsercizio": "sollevamento pesi",
  "durata": 60,  // in minuti
  "esercizi": [
    {
      "nome": "panca piana",
      "serie": 3,
      "ripetizioni": 10,
      "peso": 70  // in kg
    },
    {
      "nome": "squat",
      "serie": 4,
      "ripetizioni": 12,
      "peso": 80
    }
    
  ]
}

Risposta:
{
  "success": true,
  "message": "Allenamento in palestra registrato con successo!",
  "allenamento": {
    "id": 2001,
    "userId": 1,
    "dataAllenamento": "2024-09-27",
    "tipoEsercizio": "sollevamento pesi",
    "durata": 60,
    "esercizi": [
      {
        "nome": "panca piana",
        "serie": 3,
        "ripetizioni": 10,
        "peso": 70
      },
      {
        "nome": "squat",
        "serie": 4,
        "ripetizioni": 12,
        "peso": 80
      }
      
    ]
  }
}

OTTENERE L'ARCHIVIO DEGLI ALLENAMENTI.
Richiesta:
{
  "userId": 1
}

Risposta:
{
  "success": true,
  "allenamenti": [
    {
      "id": 2001,
      "dataAllenamento": "2024-09-27",
      "tipoEsercizio": "sollevamento pesi",
      "durata": 60,
      "esercizi": [
        {
          "nome": "panca piana",
          "serie": 3,
          "ripetizioni": 10,
          "peso": 70
        },
        {
          "nome": "squat",
          "serie": 4,
          "ripetizioni": 12,
          "peso": 80
        }
        
      ]
    },
    {
      "id": 2002,
      "dataAllenamento": "2024-09-20",
      "tipoEsercizio": "cardio",
      "durata": 30,
      "esercizi": [
        {
          "nome": "corsa su tapis roulant",
          "durata": 30,  // in minuti
          "distanza": 5   // in km
        }
        
      ]
    }
  ]
}
INSERIMENNTO ESERCIZIO ATLETA
Richiesta:
{
  "userId": 1,
  "esercizio": {
    "nome": "panca piana",
    "serie": 3,
    "ripetizioni": 10,
    "peso": 70  // in kg
  }
}
Risposta:
{
  "success": true,
  "message": "Esercizio registrato con successo!",
  "esercizio": {
    "id": 1001,
    "nome": "panca piana",
    "serie": 3,
    "ripetizioni": 10,
    "peso": 70
  }
}

INSERIMENTO ESERCIZIO TRAINER
Richiesta:
{
  "trainerId": 2,
  "esercizio": {
    "nome": "squat",
    "serie": 4,
    "ripetizioni": 12,
    "peso": 80  // in kg
  }
}
Risposta:
{
  "success": true,
  "message": "Esercizio registrato con successo!",
  "esercizio": {
    "id": 2001,
    "nome": "squat",
    "serie": 4,
    "ripetizioni": 12,
    "peso": 80
  }
}
IMPOSTARE UN TIMER PER IL RECUPERO.
Richiesta:
{
  "userId": 1,
  "timerRecupero": 60  // in secondi
}
Risposta:
{
  "success": true,
  "message": "Timer di recupero impostato con successo!",
  "timerRecupero": 60
}














