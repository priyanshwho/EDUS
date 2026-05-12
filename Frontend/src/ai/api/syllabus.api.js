const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/syllabus`;

export const fetchBranches = async () => {
  const res = await fetch(`${BASE_URL}/branches`);
  return res.json();
};

export const fetchSemesters = async (branch) => {
  const res = await fetch(`${BASE_URL}/${branch}/semesters`);
  return res.json();
};

export const fetchSubjects = async (branch, semester) => {
  const res = await fetch(`${BASE_URL}/${branch}/${semester}/subjects`);
  return res.json();
};

export const fetchSubjectDetails = async (branch, semester, subject) => {
  const res = await fetch(`${BASE_URL}/${branch}/${semester}/${subject}`);
  return res.json();
};
