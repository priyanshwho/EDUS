import { api } from './api';

export { authService } from './auth.service';
export { resourceService } from './resource.service';

export const subjectService = {
  list:   (filters = {}) => api.get('/subjects', { params: filters }),
  create: (data)         => api.post('/subjects', data),
  update: (id, data)     => api.put(`/subjects/${id}`, data),
  remove: (id)           => api.delete(`/subjects/${id}`),
};

export const analyticsService = {
  myAnalytics:         ()       => api.get('/analytics/my'),
  platformAnalytics:   ()       => api.get('/analytics/platform'),
  professorAnalytics:  (userId) => api.get(`/analytics/professor/${userId}`),
};

export const announcementService = {
  list:   (subjectId) => api.get('/announcements', { params: subjectId ? { subject_id: subjectId } : {} }),
  create: (data)      => api.post('/announcements', data),
  remove: (id)        => api.delete(`/announcements/${id}`),
};

export const userService = {
  listAll:    ()           => api.get('/users'),
  updateRole: (id, role)   => api.patch(`/users/${id}/role`, { role }),
  remove:     (id)         => api.delete(`/users/${id}`),
  savedList:  ()           => api.get('/users/saved'),
};

export const professorService = {
  list: (filters = {}) => api.get('/users/public/professors', { params: filters }),
  getByUsername: (username, filters = {}) => api.get(`/users/public/professors/${encodeURIComponent(username)}`, { params: filters }),
};
