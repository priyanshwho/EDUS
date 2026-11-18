/**
 * api.js
 * Axios-like thin fetch wrapper that:
 *  - Attaches Authorization: Bearer <token>
 *  - Handles 401 → silent refresh → retry once
 *  - Throws structured errors
 */

const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5001/api';

// Token store — updated by AuthContext
let _accessToken = null;
let _onRefreshFail = null;
let _refreshPromise = null;
let _tokenVersion = 0;

export function setToken(token) {
  if (_accessToken !== token) _tokenVersion += 1;
  _accessToken = token;
}
export function setRefreshFailHandler(fn)     { _onRefreshFail = fn; }

async function silentRefresh() {
  const version = _tokenVersion;
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method:      'POST',
    credentials: 'include',   // sends refresh cookie
  });
  if (!res.ok) throw new Error('Refresh failed');
  const { accessToken } = await res.json();
  if (version !== _tokenVersion) throw new DOMException('Session changed', 'AbortError');
  _accessToken = accessToken;
  return accessToken;
}

/** Authenticated fetch for JSON, multipart uploads and streamed responses.
 * Pass a fetch-compatible body. FormData keeps its browser-generated boundary.
 * HTTP failures throw an Error with status, code and retryAfter (seconds).
 */
export async function authenticatedRaw(path, { params, ...options } = {}) {
  const version = _tokenVersion;
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const headers = new Headers(options.headers);
  if (_accessToken) headers.set('Authorization', `Bearer ${_accessToken}`);
  const fetchOptions = { ...options, headers, credentials: 'include' };
  let res = await fetch(url.toString(), fetchOptions);
  if (version !== _tokenVersion) throw new DOMException('Session changed', 'AbortError');

  // Auto-retry once after silent refresh on 401
  // Skip retry for auth endpoints that handle their own 401s
  const skipRetry = path === '/auth/refresh' || path === '/auth/clerk-sync';
  if (res.status === 401 && !skipRetry) {
    try {
      if (!_refreshPromise) {
        _refreshPromise = silentRefresh().finally(() => { _refreshPromise = null; });
      }
      await _refreshPromise;
    } catch (error) {
      if (options.signal?.aborted || error.name === 'AbortError' || version !== _tokenVersion) throw new DOMException('Aborted', 'AbortError');
      _onRefreshFail?.();
      throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401, code: 'SESSION_EXPIRED' });
    }
    if (options.signal?.aborted || version !== _tokenVersion) throw new DOMException('Aborted', 'AbortError');
    headers.set('Authorization', `Bearer ${_accessToken}`);
    res = await fetch(url.toString(), fetchOptions);
    if (version !== _tokenVersion) throw new DOMException('Session changed', 'AbortError');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let errMsg = (typeof data.error === 'string' ? data.error : data.error?.message) || data.message;
    if (data.errors && Array.isArray(data.errors)) {
      errMsg = data.errors.map(e => e.message).join(', ');
    }
    const retryHeader = res.headers.get('Retry-After');
    const retryValue = data.retryAfter ?? data.retryAfterSeconds ?? data.error?.retryAfter ?? retryHeader;
    const retryAfter = retryValue == null ? undefined : Number.isFinite(Number(retryValue))
      ? Math.max(0, Number(retryValue))
      : Math.max(0, Math.ceil((Date.parse(retryValue) - Date.now()) / 1000));
    throw Object.assign(new Error(errMsg || `HTTP ${res.status}`), {
      status: res.status,
      code: data.code || data.error?.code,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
      details: data,
    });
  }

  return res;
}

async function request(method, path, { body, ...options } = {}) {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const res = await authenticatedRaw(path, {
    ...options, method, headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return res.status === 204 ? null : res.json();
}

export const api = {
  get:    (path, opts)         => request('GET',    path, opts),
  post:   (path, body, opts)   => request('POST',   path, { body, ...opts }),
  put:    (path, body, opts)   => request('PUT',    path, { body, ...opts }),
  patch:  (path, body, opts)   => request('PATCH',  path, { body, ...opts }),
  delete: (path, opts)         => request('DELETE', path, opts),
};
