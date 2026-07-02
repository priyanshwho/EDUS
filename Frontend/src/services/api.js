/**
 * api.js
 * Axios-like thin fetch wrapper that:
 *  - Attaches Authorization: Bearer <token>
 *  - Handles 401 → silent refresh → retry once
 *  - Throws structured errors
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Token store — updated by AuthContext
let _accessToken = null;
let _onRefreshFail = null;

export function setToken(token)               { _accessToken = token; }
export function setRefreshFailHandler(fn)     { _onRefreshFail = fn; }

async function silentRefresh() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method:      'POST',
    credentials: 'include',   // sends refresh cookie
  });
  if (!res.ok) throw new Error('Refresh failed');
  const { accessToken } = await res.json();
  _accessToken = accessToken;
  return accessToken;
}

async function request(method, path, { body, params } = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;

  const options = { method, headers, credentials: 'include' };
  if (body) options.body = JSON.stringify(body);

  let res = await fetch(url.toString(), options);

  // Auto-retry once after silent refresh on 401
  // Skip retry for auth endpoints that handle their own 401s
  const skipRetry = path === '/auth/refresh' || path === '/auth/clerk-sync';
  if (res.status === 401 && !skipRetry) {
    try {
      await silentRefresh();
      headers['Authorization'] = `Bearer ${_accessToken}`;
      options.headers = headers;
      res = await fetch(url.toString(), options);
    } catch {
      _onRefreshFail?.();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error('API Error Response:', data);
    let errMsg = data.error || data.message;
    if (data.errors && Array.isArray(data.errors)) {
      errMsg = data.errors.map(e => e.message).join(', ');
    }
    throw new Error(errMsg || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get:    (path, opts)         => request('GET',    path, opts),
  post:   (path, body, opts)   => request('POST',   path, { body, ...opts }),
  put:    (path, body, opts)   => request('PUT',    path, { body, ...opts }),
  patch:  (path, body, opts)   => request('PATCH',  path, { body, ...opts }),
  delete: (path, opts)         => request('DELETE', path, opts),
};
