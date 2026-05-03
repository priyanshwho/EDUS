const fs = require('fs');
const path = require('path');
const { extractChapterNotes } = require('../utils/parseNotes');

const NOTES_DIR = path.join(__dirname, '../data/Notes/Branch');

exports.getChapterNotes = (req, res) => {
  const { branch, semester, subject, chapterId } = req.params;
  const { chapterTitle } = req.query;

  const subjectNotesPath = path.join(NOTES_DIR, branch, semester, `${subject}.txt`);

  try {
    if (!fs.existsSync(subjectNotesPath)) {
      return res.json({
        chapterId,
        chapterTitle,
        notesExist: false,
        content: null
      });
    }

    const rawNotes = fs.readFileSync(subjectNotesPath, 'utf-8');
    const content = extractChapterNotes(rawNotes, chapterId, chapterTitle);

    res.json({
      chapterId,
      chapterTitle,
      notesExist: !!content,
      content
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not read notes' });
  }
};
