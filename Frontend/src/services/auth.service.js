import { api } from './api';

export const authService = {
  signup: (data)           => api.post('/auth/signup', data).then(res => res.data),
  login:  (data)           => api.post('/auth/login', data).then(res => res.data),
  verifyPin: (data)        => api.post('/auth/verify-pin', data).then(res => res.data),
  upgradeProfessor: (data) => api.post('/auth/upgrade-professor', data).then(res => res.data),
  superadminSwitchRole: (data) => api.post('/auth/superadmin/switch-role', data).then(res => res.data),
  refresh:   ()            => api.post('/auth/refresh').then(res => res.data),
  logout:    ()            => api.post('/auth/logout').then(res => res.data),
  me:        ()            => api.get('/auth/me').then(res => res.data),

  googleOAuthUrl:  () => `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/google`,
  githubOAuthUrl:  () => `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/github`,
};
