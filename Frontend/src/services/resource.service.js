import { api } from './api';

export const resourceService = {
  /** List resources with optional filters */
  list: (filters = {}) => api.get('/resources', { params: filters }),

  /** Get a single resource by slug */
  getBySlug: (slug) => api.get(`/resources/${slug}`),

  /** Create a resource (professor/admin) */
  create: (data) => api.post('/resources', data),

  /** Update a resource (professor-own / admin) */
  update: (id, data) => api.put(`/resources/${id}`, data),

  /** Delete a resource */
  remove: (id) => api.delete(`/resources/${id}`),

  /** Save a resource to user's list */
  save: (id) => api.post(`/resources/${id}/save`),

  /** Remove from saved list */
  unsave: (id) => api.delete(`/resources/${id}/save`),

  /**
   * Upload workflow:
   * 1. Call presign() to get a presigned PUT URL + key
   * 2. PUT the file directly to S3
   * 3. Call create() with the returned key as aws_s3_key
   */
  presign: async (file) => {
    return api.post('/upload/presign', {
      fileName:    file.name,
      contentType: file.type,
    });
  },

  uploadToS3: async (uploadUrl, file) => {
    const res = await fetch(uploadUrl, {
      method:  'PUT',
      headers: { 'Content-Type': file.type },
      body:    file,
    });
    if (!res.ok) throw new Error('S3 upload failed');
  },
};
