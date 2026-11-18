import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticatedRaw, api, setToken, setRefreshFailHandler } from '../src/services/api.js';
import { correctOptionIndex, isProcessing, isReady, sourcesForItem, uploadStudyFiles } from '../src/ai/components/study/studyUtils.js';

test('multipart uploads retain their body and browser boundary while authenticating', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; setToken(null); });
  setToken('private-token');
  const body = new FormData(); body.append('file', new Blob(['%PDF-1.7']), 'notes.pdf');
  globalThis.fetch = async (url, options) => {
    // AuthContext synchronizes the same token again after its state updates.
    setToken('private-token');
    assert.equal(url, 'http://localhost:5001/api/study/documents/doc-1/upload');
    assert.equal(options.body, body);
    assert.equal(options.headers.get('Authorization'), 'Bearer private-token');
    assert.equal(options.headers.has('Content-Type'), false);
    assert.equal(options.credentials, 'include');
    return Response.json({ document: { id: 'doc-1' } });
  };
  const response = await authenticatedRaw('/study/documents/doc-1/upload', { method: 'POST', body });
  assert.equal((await response.json()).document.id, 'doc-1');
});

test('simultaneous expired requests share one refresh and retry with the renewed token', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; setToken(null); });
  setToken('expired'); let refreshes = 0; let authorized = 0;
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) { refreshes += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return Response.json({ accessToken: 'renewed' }); }
    if (options.headers.get('Authorization') === 'Bearer expired') return Response.json({}, { status: 401 });
    assert.equal(options.headers.get('Authorization'), 'Bearer renewed'); authorized += 1;
    return Response.json({ workspaces: [] });
  };
  await Promise.all([api.get('/study/workspaces'), api.get('/study/workspaces')]);
  assert.equal(refreshes, 1); assert.equal(authorized, 2);
});

test('rate limits preserve structured codes and retry timing', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => Response.json({ code: 'UPLOAD_BUDGET', error: 'Upload limit reached' }, { status: 429, headers: { 'Retry-After': '45' } });
  await assert.rejects(api.post('/study/workspaces', {}), (error) => error.status === 429 && error.code === 'UPLOAD_BUDGET' && error.retryAfter === 45);
});

test('an old refresh cannot replace a newly signed-in account token', async context => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; setToken(null); setRefreshFailHandler(null); });
  setToken('old-account');
  let finishRefresh, startedRefresh;
  const started = new Promise(resolve => { startedRefresh = resolve; });
  let expired = false;
  setRefreshFailHandler(() => { expired = true; });
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) { startedRefresh(); return new Promise(resolve => { finishRefresh = resolve; }); }
    if (options.headers.get('Authorization') === 'Bearer old-account') return Response.json({}, { status: 401 });
    assert.equal(options.headers.get('Authorization'), 'Bearer new-account');
    return Response.json({ workspaces: [] });
  };
  const pending = api.get('/study/workspaces');
  const rejected = assert.rejects(pending, { name: 'AbortError' });
  await started;
  setToken('new-account');
  finishRefresh(Response.json({ accessToken: 'stale-refreshed-account' }));
  await rejected;
  await api.get('/study/workspaces');
  assert.equal(expired, false);
});

test('aborted requests are not treated as an expired session', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; setRefreshFailHandler(null); });
  let reset = false; setRefreshFailHandler(() => { reset = true; });
  const controller = new AbortController(); controller.abort();
  globalThis.fetch = async (_url, options) => { assert.equal(options.signal, controller.signal); throw new DOMException('Aborted', 'AbortError'); };
  await assert.rejects(api.get('/study/workspaces', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(reset, false);
});

test('partial upload retries keep successful PDFs and reuse registered document IDs', async () => {
  const files = ['syllabus.pdf', 'notes.pdf'].map((name, index) => ({ key: name, kind: index ? 'notes' : 'syllabus', file: { name, size: 100 }, containsHandwriting: index === 1 }));
  let registrations = 0; let fail = true; const uploads = [];
  const fakeApi = {
    get: async () => ({ documents: [{ id: 'notes.pdf', status: 'reserved' }] }),
    initUpload: async (_workspace, metadata) => { registrations += 1; assert.equal(metadata.sizeBytes, 100); return { document: { id: metadata.filename } }; },
    upload: async (id) => { uploads.push(id); if (id === 'notes.pdf' && fail) throw new Error('Connection lost'); },
  };
  const first = await uploadStudyFiles(fakeApi, 'workspace', files);
  assert.equal(first[0].uploaded, true); assert.equal(first[1].state, 'failed'); assert.equal(first[1].documentId, 'notes.pdf');
  fail = false;
  const second = await uploadStudyFiles(fakeApi, 'workspace', first);
  assert.equal(second.every((file) => file.uploaded), true); assert.equal(registrations, 2);
  assert.deepEqual(uploads, ['syllabus.pdf', 'notes.pdf', 'notes.pdf']);
});

test('practice answers resolve backend letter keys and cite only the referenced sources', () => {
  const item = { options: ['Process', 'Thread', 'CPU', 'Memory'], correct: 'B', sourceIds: ['S2'] };
  assert.equal(correctOptionIndex(item), 1);
  assert.deepEqual(sourcesForItem(item, [{ id: 'S1' }, { id: 'S2' }]), [{ id: 'S2' }]);
});

test('partially extracted PDFs remain searchable with their reliability warning', () => {
  assert.equal(isProcessing({ status: 'queued' }), true);
  assert.equal(isProcessing({ status: 'processing', processingStage: 'ocr' }), true);
  for (const status of ['reserved', 'ready', 'partial', 'failed', 'deleting']) assert.equal(isProcessing({ status }), false);
  assert.equal(isReady({ status: 'partial' }), true); assert.equal(isReady({ status: 'ready' }), true);
});

test('lost upload responses are reconciled rather than replaying consumed tickets', async () => {
  let uploads = 0;
  const api = { get: async () => ({ documents: [{ id: 'accepted', status: 'queued' }] }), upload: async () => { uploads++; } };
  const [result] = await uploadStudyFiles(api, 'workspace', [{ key: 'one', documentId: 'accepted', file: { name: 'notes.pdf', size: 10 }, kind: 'notes' }]);
  assert.equal(result.uploaded, true);
  assert.equal(uploads, 0);
});

test('an interrupted consumed upload gets a new quota reservation', async () => {
  const uploads = [];
  const api = { get: async () => ({ documents: [{ id: 'old', status: 'deleting' }] }), initUpload: async () => ({ document: { id: 'new' } }), upload: async (id) => uploads.push(id) };
  const [result] = await uploadStudyFiles(api, 'workspace', [{ key: 'one', documentId: 'old', file: { name: 'notes.pdf', size: 10 }, kind: 'notes' }]);
  assert.equal(result.documentId, 'new');
  assert.deepEqual(uploads, ['new']);
});
