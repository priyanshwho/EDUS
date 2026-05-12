const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ai`;

export const generateFlashcards = async (data) => {
  const res = await fetch(`${BASE_URL}/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const generateMCQ = async (data) => {
  const res = await fetch(`${BASE_URL}/mcq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const streamAIInteract = async (data, onToken, onDone, onError, signal) => {
  try {
    const response = await fetch(`${BASE_URL}/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) onToken(parsed.token);
            if (parsed.error) onError(parsed.error);
          } catch (e) {
            // ignore partial JSON lines
          }
        }
      }
    }
    // If stream ends without [DONE], call onDone anyway
    onDone();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream aborted by user');
    } else {
      onError(error);
    }
  }
};

export const generatePYQ = async (data) => {
  const res = await fetch(`${BASE_URL}/pyq`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const evaluateAnswer = async (data) => {
  const res = await fetch(`${BASE_URL}/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
};
