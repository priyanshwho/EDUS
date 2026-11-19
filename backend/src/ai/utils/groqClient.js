const { sql } = require('../../db/client');
const { createFreeGroq } = require('../study/free-groq');
const complete = createFreeGroq({ sql });

async function callGroq({ systemPrompt, userPrompt, userId }) {
  const messages = [
    { role: 'system', content: String(systemPrompt).slice(0, 16000) },
    { role: 'user', content: String(userPrompt).slice(0, 12000) }
  ];

  const response = await complete({ userId, messages });
  return response.choices[0]?.message?.content || '';
}

module.exports = { callGroq, complete };
