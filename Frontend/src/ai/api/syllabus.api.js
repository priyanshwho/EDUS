import { api } from '../../services/api';

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/syllabus`;

export const fetchBranches = async () => {
  const res = await fetch(`${BASE_URL}/branches`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchSemesters = async (branch) => {
  const res = await fetch(`${BASE_URL}/${branch}/semesters`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchSubjects = async (branch, semester) => {
  const res = await fetch(`${BASE_URL}/${branch}/${semester}/subjects`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchSubjectDetails = async (branch, semester, subject) => {
  const res = await fetch(`${BASE_URL}/${branch}/${semester}/${subject}`);
  return res.json();
};

export const createSyllabus = async (payload) => {
  return api.post('/syllabus', payload);
};

export const updateSyllabus = async (id, payload) => {
  return api.put(`/syllabus/${id}`, payload);
};

export const deleteSyllabus = async (id) => {
  return api.delete(`/syllabus/${id}`);
};

export const fetchMyUploads = async () => {
  return api.get('/syllabus/my-uploads');
};
