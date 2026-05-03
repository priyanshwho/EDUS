/**
 * Extracts notes for a specific chapter from a subject's notes file.
 * @param {string} rawNotes - The raw text content of the notes file.
 * @param {string} chapterId - The ID of the chapter to extract.
 * @param {string} chapterTitle - The title of the chapter.
 * @returns {string|null} The extracted notes content or null if not found.
 */
function extractChapterNotes(rawNotes, chapterId, chapterTitle) {
  // Try to find the chapter by title or ID in the text.
  const escapedTitle = chapterTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:CHAPTER|Chapter|#)\\s*.*${escapedTitle}[\\s\\S]*?(?=(?:CHAPTER|Chapter|#)|$)`, 'i');

  const match = rawNotes.match(regex);
  return match ? match[0].trim() : null;
}

module.exports = { extractChapterNotes };
