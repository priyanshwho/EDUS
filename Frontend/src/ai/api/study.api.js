import { api, authenticatedRaw } from '../../services/api';

const workspacePath = (id) => `/study/workspaces/${encodeURIComponent(id)}`;
const documentPath = (id) => `/study/documents/${encodeURIComponent(id)}`;

export const studyApi = {
  list: (signal) => api.get('/study/workspaces', { signal }),
  create: (data) => api.post('/study/workspaces', data),
  get: (id, signal) => api.get(workspacePath(id), { signal }),
  remove: (id) => api.delete(workspacePath(id)),
  initUpload: (id, data) => api.post(`${workspacePath(id)}/uploads`, data),
  async upload(documentId, file, signal) {
    const body = new FormData();
    body.append('file', file);
    const response = await authenticatedRaw(`${documentPath(documentId)}/upload`, {
      method: 'POST', body, signal,
    });
    return response.json();
  },
  removeDocument: (id) => api.delete(documentPath(id)),
  retry: (id) => api.post(`${documentPath(id)}/retry`, {}),
  source: (id) => api.get(`${documentPath(id)}/source`),
  chat: (id, data, signal) => api.post(`${workspacePath(id)}/chat`, data, { signal }),
  generate: (id, kind, data, signal) => api.post(`${workspacePath(id)}/${kind}`, data, { signal }),
};

export function studyError(error) {
  const message = error?.message || 'Something went wrong. Please try again.';
  return error?.retryAfter > 0 ? `${message} Try again in ${Math.ceil(error.retryAfter)} seconds.` : message;
}
