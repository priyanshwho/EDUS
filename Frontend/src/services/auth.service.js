import { api } from './api';

export const authService = {
  signup: (data)           => api.post('/auth/signup', data),
  login:  (data)           => api.post('/auth/login', data),
  verifyPin: (data)        => api.post('/auth/verify-pin', data),
  upgradeProfessor: (data) => api.post('/auth/upgrade-professor', data),
  superadminSwitchRole: (data) => api.post('/auth/superadmin/switch-role', data),
  refresh:   ()            => api.post('/auth/refresh'),
  logout:    ()            => api.post('/auth/logout'),
  me:        ()            => api.get('/auth/me'),

  googleOAuthUrl:  () => `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/google`,
  githubOAuthUrl:  () => `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/github`,
};
