const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { uploadInput, workspaceInput, assertId, LIMITS, publicDocument } = require('../src/ai/study/policy');
const { inspectPdf } = require('../src/ai/study/documents.service');

test('PDF reservations bound byte counts, document kinds and filename paths', () => {
  assert.equal(uploadInput({ kind: 'notes', filename: 'Lecture.PDF', sizeBytes: LIMITS.notesBytes }).sizeBytes, LIMITS.notesBytes);
  for (const sizeBytes of [0, -1, 2.5, '100', Infinity, LIMITS.notesBytes + 1]) {
    assert.throws(() => uploadInput({ kind: 'notes', filename: 'x.pdf', sizeBytes }), (error) => error.status === 413);
  }
  assert.throws(() => uploadInput({ kind: 'syllabus', filename: 'x.pdf', sizeBytes: LIMITS.syllabusBytes + 1 }));
  for (const filename of ['../secret.pdf', 'C:\\secret.pdf', 'notpdf.txt', 'bad\0.pdf']) {
    assert.throws(() => uploadInput({ kind: 'notes', filename, sizeBytes: 10 }));
  }
  assert.throws(() => uploadInput({ kind: 'other', filename: 'a.pdf', sizeBytes: 1 }));
  assert.throws(() => uploadInput({ kind: 'notes', filename: 'a.pdf', sizeBytes: 1, containsHandwriting: 'false' }));
});

test('workspace input validates boundaries before SQL and normalizes optional values', () => {
  assert.deepEqual(workspaceInput({ title: '  Networks  ', branch: ' CSE ', semester: 4 }), { title: 'Networks', branch: 'CSE', semester: 4, idempotencyKey: null });
  assert.throws(() => workspaceInput({ title: '  ' }));
  assert.throws(() => workspaceInput({ title: 'Networks', semester: '4' }));
  assert.throws(() => workspaceInput({ title: 'Networks', idempotencyKey: 'short' }));
  assert.throws(() => assertId("' OR TRUE --"));
});

test('API documents never expose private storage keys, upload tokens or hashes', () => {
  const value = publicDocument({ id: 'id', size_bytes: '20', s3_key: 'private', upload_token: 'secret', sha256: 'hash' });
  assert.equal(value.sizeBytes, 20);
  assert.equal('s3_key' in value, false);
  assert.equal('upload_token' in value, false);
  assert.equal('sha256' in value, false);
});

test('file inspection rejects forged MIME content and size mismatch before storage', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'edus-pdf-test-'));
  const file = path.join(directory, 'source.pdf');
  try {
    await fs.writeFile(file, 'this is not a pdf');
    await assert.rejects(inspectPdf(file, 17), (error) => error.code === 'INVALID_PDF');
    await fs.writeFile(file, '%PDF-1.7\nexample');
    await assert.rejects(inspectPdf(file, 1), (error) => error.code === 'UPLOAD_SIZE_MISMATCH');
    const result = await inspectPdf(file, 16);
    assert.equal(result.sizeBytes, 16);
    assert.match(result.sha256, /^[0-9a-f]{64}$/);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
