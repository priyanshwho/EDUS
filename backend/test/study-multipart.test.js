const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const { receivePdf } = require('../src/ai/study/study.routes');

function request(bytes, fields = '') {
  const boundary = 'study-test-boundary';
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="source.pdf"\r\nContent-Type: application/pdf\r\n\r\n`), bytes, Buffer.from(`\r\n${fields}--${boundary}--\r\n`)]);
  const req = new PassThrough();
  req.method = 'POST';
  req.headers = { 'content-type': `multipart/form-data; boundary=${boundary}`, 'content-length': String(body.length) };
  return { req, body };
}

test('authenticated upload parser accepts one actual multipart PDF and enforces reserved bytes', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'edus-multipart-test-'));
  try {
    const bytes = Buffer.from('%PDF-1.7\nfixture\n%%EOF\n');
    const good = request(bytes);
    const parsed = receivePdf(good.req, {}, { size_bytes: bytes.length, kind: 'notes' }, directory);
    good.req.end(good.body);
    await parsed;
    assert.equal(good.req.file.size, bytes.length);
    assert.deepEqual(await fs.readFile(good.req.file.path), bytes);
    const bad = request(bytes);
    const refused = receivePdf(bad.req, {}, { size_bytes: 5, kind: 'notes' }, directory);
    bad.req.end(bad.body);
    await assert.rejects(refused, (error) => error.code === 'LIMIT_FILE_SIZE');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
