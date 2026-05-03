const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

router.post('/flashcards', aiController.generateFlashcards);
router.post('/mcq', aiController.generateMCQ);
router.post('/interact', aiController.interact);
router.post('/pyq', aiController.generatePYQ);
router.post('/evaluate', aiController.evaluate);

module.exports = router;
