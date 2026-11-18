// Network chunks may split an SSE event at any byte. Keep incomplete events.
export function createSSEParser(onData) {
  let buffer = '';
  return {
    push(text) {
      buffer += text;
      let match;
      while ((match = /\r?\n\r?\n/.exec(buffer))) {
        const event = buffer.slice(0, match.index);
        buffer = buffer.slice(match.index + match[0].length);
        const data = event.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
        if (data) onData(data);
      }
    },
  };
}
