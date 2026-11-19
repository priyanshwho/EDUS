import { api, authenticatedRaw } from '../../services/api';
import { createSSEParser } from './sse';

export const generateFlashcards = async (data) => {
  return api.post('/ai/flashcards', data);
};

export const generateMCQ = async (data) => {
  return api.post('/ai/mcq', data);
};

export const streamAIInteract = async (data, onToken, onDone, onError, signal) => {
  try {
    const response = await authenticatedRaw('/ai/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, messages: data.messages?.slice(-10).map(({ role, content }) => ({ role, content: content.slice(0, 2000) })) }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completed = false;
    const parser = createSSEParser(dataStr => {
      if (dataStr === '[DONE]') { completed = true; return; }
      const parsed = JSON.parse(dataStr);
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.token) onToken(parsed.token);
    });

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      parser.push(decoder.decode(value, { stream: true }));
      if (completed) { await reader.cancel(); onDone(); return; }
    }
    parser.push(decoder.decode());
    if (!completed) throw new Error('The AI stream ended before completing. Please try again.');
    onDone();
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    } else {
      onError(error);
    }
  }
};

export const generatePYQ = async (data) => {
  return api.post('/ai/pyq', data);
};

export const evaluateAnswer = async (data) => {
  return api.post('/ai/evaluate', data);
};
