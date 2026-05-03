const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');

router.get('/:branch/:semester/:subject/:chapterId', notesController.getChapterNotes);

module.exports = router;
