const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../../middleware/authenticate');

router.post('/flashcards', authenticate, aiController.generateFlashcards);
router.post('/mcq', authenticate, aiController.generateMCQ);
router.post('/interact', authenticate, aiController.interact);
router.post('/pyq', authenticate, aiController.generatePYQ);
router.post('/evaluate', authenticate, aiController.evaluate);

module.exports = router;
