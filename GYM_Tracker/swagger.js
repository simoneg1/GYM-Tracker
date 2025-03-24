const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GYM Tracker API',
      version: '1.0.0',
      description: 'API di GYM Tracker per la gestione di esercizi e allenamenti',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Server di sviluppo',
      },
    ],
  },
  apis: ['./routes/*.js'], // Percorso ai file con i commenti JSDoc
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs),
};