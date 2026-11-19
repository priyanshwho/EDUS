const { test } = require('node:test');
const assert = require('node:assert/strict');

test('SSE parser preserves JSON events split at every network boundary', async () => {
  const { createSSEParser } = await import('../../Frontend/src/ai/api/sse.js');
  const raw = 'data: {"token":"hello"}\n\ndata: [DONE]\n\n';
  for (let split = 1; split < raw.length; split++) {
    const events = [];
    const parser = createSSEParser(data => events.push(data));
    parser.push(raw.slice(0, split));
    parser.push(raw.slice(split));
    assert.deepEqual(events, ['{"token":"hello"}', '[DONE]']);
  }
});
test('SSE parser accepts CRLF and multiline data', async () => {
  const { createSSEParser } = await import('../../Frontend/src/ai/api/sse.js');
  const events = [];
  const parser = createSSEParser(data => events.push(data));
  parser.push(': keepalive\r\n\r\ndata: one\r\ndata: two\r\n\r\n');
  assert.deepEqual(events, ['one\ntwo']);
});
