const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createGroqBudget, textModel } = require('../src/ai/study/groq-budget');
const { createFreeGroq } = require('../src/ai/study/free-groq');

function quotaDatabase() {
  let state = new Map();
  return { state: () => state, async begin(work) {
    const before = new Map(state);
    try { return await work({ unsafe: async (_query, [scope, bucket, window, amount, cap]) => {
      const key = `${scope}:${bucket}:${window.toISOString()}`;
      const next = (state.get(key) || 0) + amount;
      if (state.has(key) && next > cap) return [];
      state.set(key, next);
      return [{ amount: next }];
    } }); } catch (error) { state = before; throw error; }
  } };
}
const model = 'openai/gpt-oss-120b';
const env = { STUDY_GROQ_FREE_PLAN_CONFIRMED: 'true' };
const now = () => Date.parse('2026-11-18T10:01:05Z');

test('free plan must be explicitly confirmed before any reservation', async () => {
  const sql = quotaDatabase();
  await assert.rejects(createGroqBudget({ sql, env: {}, now })({ model, inputTokens: 10, outputTokens: 10 }), { code: 'FREE_PLAN_UNCONFIRMED' });
  assert.equal(sql.state().size, 0);
});
test('paid or unknown model configuration is rejected', () => {
  assert.throws(() => textModel({ GROQ_MODEL: 'unknown-paid-model' }), { code: 'FREE_MODEL_REQUIRED' });
  assert.equal(textModel({}), model);
});
test('all quotas roll back if any shared token budget is exhausted', async () => {
  const sql = quotaDatabase();
  const reserve = createGroqBudget({ sql, env, now });
  await reserve({ model, userId: 'student', inputTokens: 2000, outputTokens: 2000 });
  const before = [...sql.state()];
  await assert.rejects(reserve({ model, userId: 'student', inputTokens: 4000, outputTokens: 2000 }), { code: 'AI_QUOTA_REACHED', status: 429 });
  assert.deepEqual([...sql.state()], before);
});
test('an oversized first request cannot initialize a quota above the cap', async () => {
  const sql = quotaDatabase();
  await assert.rejects(createGroqBudget({ sql, env, now })({ model, inputTokens: 9000, outputTokens: 100 }), { code: 'AI_QUOTA_REACHED' });
  assert.equal(sql.state().size, 0);
});
test('per-student daily limit is independent of global provider capacity', async () => {
  const sql = quotaDatabase();
  const reserve = createGroqBudget({ sql, env: { ...env, STUDY_AI_REQUESTS_DAY: '1' }, now });
  await reserve({ model, userId: 'one', inputTokens: 100, outputTokens: 100 });
  await assert.rejects(reserve({ model, userId: 'one', inputTokens: 100, outputTokens: 100 }), { code: 'AI_QUOTA_REACHED' });
  await reserve({ model, userId: 'two', inputTokens: 100, outputTokens: 100 });
});
test('Groq exhaustion surfaces a retryable error without provider fallback', async () => {
  let calls = 0;
  const complete = createFreeGroq({ sql: quotaDatabase(), env, now, client: { chat: { completions: { create: async () => {
    calls++;
    throw Object.assign(new Error('capacity'), { status: 429 });
  } } } } });
  await assert.rejects(complete({ messages: [{ role: 'user', content: 'hello' }] }), { code: 'AI_QUOTA_REACHED' });
  assert.equal(calls, 1);
});
