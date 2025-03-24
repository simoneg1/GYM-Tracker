const express = require('express');
const router = express.Router();
const axios = require('axios');


/**
 * @swagger
 * /api/exercises:
 *   get:
 *     summary: Recupera esercizi da API Ninjas
 *     description: Recupera tutti gli esercizi disponibili dall'API esterna
 *     tags: [Esercizi]
 *     responses:
 *       200:
 *         description: Lista di esercizi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 *       500:
 *         description: Errore del server
 */
router.get('/exercises', async (req, res) => {
  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/exercises', {
      headers: {
        'X-Api-Key': 'MVi0MTdd5DNbPt4ZG2kA+w==LBPZw114n7FmMhsG',
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore durante il recupero degli esercizi' });
  }
});

/**
 * @swagger
 * /api/exercises/chest:
 *   get:
 *     summary: Recupera esercizi per il petto
 *     description: Recupera esercizi specifici per il muscolo petto
 *     tags: [Esercizi]
 *     responses:
 *       200:
 *         description: Lista di esercizi per il petto
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 *       500:
 *         description: Errore del server
 */
router.get('/exercises/chest', async (req, res) => {
  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/exercises?muscle=chest', {
      headers: {
        'X-Api-Key': 'MVi0MTdd5DNbPt4ZG2kA+w==LBPZw114n7FmMhsG',
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore durante il recupero degli esercizi' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Exercise:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nome dell'esercizio
 *           example: Bench Press
 *         type:
 *           type: string
 *           description: Tipo di esercizio
 *           example: strength
 *         muscle:
 *           type: string
 *           description: Gruppo muscolare principale
 *           example: chest
 *         equipment:
 *           type: string
 *           description: Attrezzatura necessaria
 *           example: barbell
 *         difficulty:
 *           type: string
 *           description: Livello di difficoltà
 *           example: intermediate
 *         instructions:
 *           type: string
 *           description: Istruzioni dettagliate
 *           example: Lie on the bench with your feet on the ground...
 */

