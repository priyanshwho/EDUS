const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq({ systemPrompt, userPrompt, stream = false, res = null }) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  if (stream && res) {
    // SSE streaming to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const streamResponse = await groq.chat.completions.create({
        model,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1500
      });

      for await (const chunk of streamResponse) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error('Groq Stream Error:', error);
      res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
      res.end();
    }
  } else {
    try {
      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      });
      return response.choices[0].message.content;
    } catch (error) {
      // Log structured error details for easier diagnosis
      const status = error?.status || error?.statusCode || 'unknown';
      const code   = error?.error?.code || error?.code || 'unknown';
      console.error(`Groq API Error [HTTP ${status}] [code: ${code}]:`, error?.message || error);
      throw error;
    }
  }
}

module.exports = { callGroq };
