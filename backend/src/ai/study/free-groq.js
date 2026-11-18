const { createGroqBudget, textModel, positive } = require('./groq-budget');
const { StudyError } = require('./errors');

function estimateTokens(messages) {
  return Math.ceil(Buffer.byteLength(JSON.stringify(messages), 'utf8') / 3) + 200;
}

function createFreeGroq({ sql, env = process.env, client, now }) {
  const reserve = createGroqBudget({ sql, env, now });
  return async function complete({ messages, userId, stream = false, schema, maxTokens = 1800 }) {
    const model = textModel(env);
    if (!env.GROQ_API_KEY && !client) throw new StudyError(503, 'AI_NOT_CONFIGURED', 'AI is not configured yet.');
    const outputTokens = Math.min(positive(env.STUDY_MAX_OUTPUT_TOKENS, 2000), maxTokens);
    await reserve({ model, userId, inputTokens: estimateTokens(messages), outputTokens });
    const groq = client || new (require('groq-sdk'))({ apiKey: env.GROQ_API_KEY, maxRetries: 0, timeout: 60000 });
    try {
      return await groq.chat.completions.create({
        model, messages, stream, temperature: 0.2, reasoning_effort: 'low',
        max_completion_tokens: outputTokens,
        ...(schema ? { response_format: { type: 'json_schema', json_schema: { name: 'study_response', strict: true, schema } } } : {}),
      });
    } catch (error) {
      if (error.status === 429) throw new StudyError(429, 'AI_QUOTA_REACHED', 'Groq free-plan capacity is busy. Please try again later.', Number(error.headers?.get?.('retry-after')) || 60);
      throw new StudyError(502, 'AI_PROVIDER_ERROR', 'The AI provider could not complete this request. Please try again.');
    }
  };
}

module.exports = { createFreeGroq, estimateTokens };
