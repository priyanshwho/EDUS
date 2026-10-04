const express = require('express');
const router = express.Router();
const syllabusController = require('../controllers/syllabus.controller');
const { authenticate } = require('../../middleware/authenticate');
const { requireProfessor } = require('../../middleware/role.middleware');

router.get('/branches', syllabusController.getBranches);
router.get('/my-uploads', authenticate, requireProfessor, syllabusController.getMyUploads);
router.get('/:branch/semesters', syllabusController.getSemesters);
router.get('/:branch/:semester/subjects', syllabusController.getSubjects);
router.get('/:branch/:semester/:subject', syllabusController.getSubjectDetails);

// Protected write routes (Professor & Admin only)
router.post('/', authenticate, requireProfessor, syllabusController.createSyllabus);
router.delete('/:id', authenticate, requireProfessor, syllabusController.deleteSyllabus);

module.exports = router;
