const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabus.controller');

router.get('/branches', syllabusController.getBranches);
router.get('/:branch/semesters', syllabusController.getSemesters);
router.get('/:branch/:semester/subjects', syllabusController.getSubjects);
router.get('/:branch/:semester/:subject', syllabusController.getSubjectDetails);

module.exports = router;
