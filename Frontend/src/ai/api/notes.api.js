const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/notes`;

export const fetchChapterNotes = async (branch, semester, subject, chapterId, chapterTitle) => {
  const res = await fetch(`${BASE_URL}/${branch}/${semester}/${subject}/${chapterId}?chapterTitle=${encodeURIComponent(chapterTitle)}`);
  return res.json();
};
