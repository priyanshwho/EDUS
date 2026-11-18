const { StudyError } = require('./errors');

const TEXT_MODELS = new Set(['openai/gpt-oss-120b', 'openai/gpt-oss-20b']);
const VISION_MODEL = 'qwen/qwen3.8-27b';
const positive = (value, fallback) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

function textModel(env = process.env) {
  const model = env.STUDY_TEXT_MODEL || env.GROQ_MODEL || 'openai/gpt-oss-120b';
  if (!TEXT_MODELS.has(model)) throw new StudyError(503, 'FREE_MODEL_REQUIRED', 'Configure an allowed Groq free-plan text model.');
  return model;
}

function createGroqBudget({ sql, env = process.env, now = () => Date.now() }) {
  return async function reserve({ model, userId, inputTokens, outputTokens }) {
    if (env.STUDY_GROQ_FREE_PLAN_CONFIRMED !== 'true') {
      throw new StudyError(503, 'FREE_PLAN_UNCONFIRMED', 'The administrator must confirm the Groq Free plan before enabling AI.');
    }
    if (!TEXT_MODELS.has(model) && model !== VISION_MODEL) throw new StudyError(503, 'FREE_MODEL_REQUIRED', 'This model is not enabled for the Groq free plan.');
    const tokens = Math.max(1, Math.ceil(inputTokens)) + Math.max(1, Math.ceil(outputTokens));
    const time = now();
    const minute = new Date(Math.floor(time / 60000) * 60000);
    const day = new Date(Math.floor(time / 86400000) * 86400000);
    const reservations = [
      ['groq_requests_minute', minute, 1, positive(env.STUDY_GROQ_RPM, 30), 60],
      ['groq_requests_day', day, 1, positive(env.STUDY_GROQ_RPD, 1000), 86400],
      ['groq_tokens_minute', minute, tokens, positive(env.STUDY_GROQ_TPM, 8000), 60],
      ['groq_tokens_day', day, tokens, positive(env.STUDY_GROQ_TPD, 200000), 86400],
    ].map(([bucket, window, amount, limit, seconds]) => ({ scope: `groq:${model}`, bucket, window, amount, limit, seconds }));
    if (userId) reservations.push({ scope: `user:${userId}`, bucket: 'ai_requests_day', window: day, amount: 1, limit: positive(env.STUDY_AI_REQUESTS_DAY, 20), seconds: 86400 });
    // Same sorted row order as the Python vision worker prevents deadlocks.
    reservations.sort((a, b) => `${a.scope}:${a.bucket}`.localeCompare(`${b.scope}:${b.bucket}`));
    await sql.begin(async tx => {
      for (const item of reservations) {
        const rows = await tx.unsafe(`INSERT INTO study_usage(scope,bucket,window_start,amount) VALUES($1,$2,$3,$4)
          ON CONFLICT(scope,bucket,window_start) DO UPDATE SET amount=study_usage.amount+EXCLUDED.amount
          WHERE study_usage.amount+EXCLUDED.amount <= $5 RETURNING amount`,
        [item.scope, item.bucket, item.window, item.amount, item.limit]);
        if (item.amount > item.limit || !rows.length) {
          const retry = Math.max(1, Math.ceil((item.window.getTime() + item.seconds * 1000 - time) / 1000));
          throw new StudyError(429, 'AI_QUOTA_REACHED', 'AI quota reached. Try again after the quota resets.', retry);
        }
      }
    });
  };
}

module.exports = { createGroqBudget, textModel, TEXT_MODELS, VISION_MODEL, positive };
