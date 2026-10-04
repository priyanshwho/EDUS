const syllabusService = require('../../services/syllabus.service');

exports.getBranches = async (_req, res) => {
  try {
    const branches = await syllabusService.getBranches();
    res.json(branches);
  } catch (error) {
    console.error('[syllabus.controller] getBranches error:', error);
    res.status(500).json({ error: 'Could not read branches' });
  }
};

exports.getSemesters = async (req, res) => {
  const { branch } = req.params;
  try {
    const semesters = await syllabusService.getSemesters(branch);
    res.json(semesters);
  } catch (error) {
    console.error('[syllabus.controller] getSemesters error:', error);
    res.status(500).json({ error: 'Could not read semesters' });
  }
};

exports.getSubjects = async (req, res) => {
  const { branch, semester } = req.params;
  try {
    const subjects = await syllabusService.getSubjects(branch, semester);
    res.json(subjects);
  } catch (error) {
    console.error('[syllabus.controller] getSubjects error:', error);
    res.status(500).json({ error: 'Could not read subjects' });
  }
};

exports.getSubjectDetails = async (req, res) => {
  const { branch, semester, subject } = req.params;
  try {
    const details = await syllabusService.getSubjectDetails(branch, semester, subject);
    if (!details) {
      return res.status(404).json({ error: `Subject not found: ${subject}` });
    }
    res.json(details);
  } catch (error) {
    console.error('[syllabus.controller] getSubjectDetails error:', error);
    res.status(500).json({ error: 'Could not parse syllabus' });
  }
};

exports.createSyllabus = async (req, res) => {
  try {
    const { subjectName, subjectCode, branch, semester, content, sectionA, sectionB } = req.body;
    const userId = req.user?.id;

    const result = await syllabusService.createSyllabus({
      subjectName,
      subjectCode,
      branch,
      semester,
      content,
      sectionA,
      sectionB,
      userId,
    });

    res.status(201).json({
      message: 'Syllabus saved successfully',
      syllabus: result,
    });
  } catch (error) {
    console.error('[syllabus.controller] createSyllabus error:', error);
    res.status(400).json({ error: error.message || 'Failed to save syllabus' });
  }
};

exports.deleteSyllabus = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await syllabusService.deleteSyllabus(id, req.user);
    res.json({ message: 'Syllabus deleted successfully', ...result });
  } catch (error) {
    console.error('[syllabus.controller] deleteSyllabus error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete syllabus' });
  }
};
