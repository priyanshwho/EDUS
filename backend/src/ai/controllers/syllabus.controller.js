const fs = require('fs');
const path = require('path');
const { parseSyllabus } = require('../utils/parseSyllabus');

const DATA_DIR = path.join(__dirname, '../data/Syllabus/Branch');

const isVisible = (name) => !name.startsWith('.');

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

exports.getBranches = (_req, res) => {
  try {
    const branches = fs.readdirSync(DATA_DIR)
      .filter(isVisible)
      .filter(file => fs.statSync(path.join(DATA_DIR, file)).isDirectory());
    res.json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not read branches' });
  }
};

exports.getSemesters = (req, res) => {
  const { branch } = req.params;
  const branchPath = path.join(DATA_DIR, branch);
  try {
    if (!fs.existsSync(branchPath)) return res.status(404).json({ error: 'Branch not found' });
    const semesters = fs.readdirSync(branchPath)
      .filter(isVisible)
      .filter(file => fs.statSync(path.join(branchPath, file)).isDirectory());
    res.json(semesters);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not read semesters' });
  }
};

exports.getSubjects = (req, res) => {
  const { branch, semester } = req.params;
  const semesterPath = path.join(DATA_DIR, branch, semester);
  try {
    if (!fs.existsSync(semesterPath)) return res.status(404).json({ error: 'Semester not found' });
    const subjects = fs.readdirSync(semesterPath)
      .filter(isVisible)
      .filter(file => file.endsWith('.txt'))
      .map(file => file.replace('.txt', ''));
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not read subjects' });
  }
};

exports.getSubjectDetails = (req, res) => {
  const { branch, semester, subject } = req.params;
  const subjectPath = path.join(DATA_DIR, branch, semester, `${subject}.txt`);

  try {
    if (!fs.existsSync(subjectPath)) {
      return res.status(404).json({ error: `Subject not found: ${subject}` });
    }
    const rawText = fs.readFileSync(subjectPath, 'utf-8');
    const slug = toSlug(subject);
    const sections = parseSyllabus(slug, rawText);

    res.json({
      subjectName: subject,
      rawText,
      sections,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not parse syllabus' });
  }
};
