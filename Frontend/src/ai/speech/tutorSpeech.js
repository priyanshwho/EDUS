// Keep one explicit voice for the session, including when browser voices load late.
export function selectTutorVoice(voices) {
  const score = (voice) =>
    (/^en[-_]US$/i.test(voice.lang) ? 100 : 0) +
    (voice.localService ? 30 : 0) +
    (/natural/i.test(voice.name) ? 20 : /google|samantha/i.test(voice.name) ? 15 : 0) +
    (voice.default ? 5 : 0);
  return [...voices].filter(voice => /^en(?:[-_]|$)/i.test(voice.lang))
    .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name) || a.voiceURI.localeCompare(b.voiceURI))[0];
}

export function createTutorSpeech({ synth, createUtterance, onStart, onEnd, onError, voiceWaitMs = 4000 }) {
  let voice = null;
  let generation = 0;
  let utterance = null;
  let stopWaiting = null;

  function cancel() {
    generation++;
    stopWaiting?.();
    if (utterance) utterance.onstart = utterance.onend = utterance.onerror = null;
    utterance = null;
    synth?.cancel();
  }

  function waitForVoice() {
    const available = selectTutorVoice(synth.getVoices());
    if (available) return Promise.resolve(available);
    return new Promise(resolve => {
      let timer;
      const finish = (found) => {
        clearTimeout(timer);
        synth.removeEventListener('voiceschanged', changed);
        stopWaiting = null;
        resolve(found);
      };
      const changed = () => {
        const found = selectTutorVoice(synth.getVoices());
        if (found) finish(found);
      };
      stopWaiting = () => finish(null);
      synth.addEventListener('voiceschanged', changed);
      timer = setTimeout(() => finish(null), voiceWaitMs);
      changed(); // Close the gap between the first read and listener registration.
    });
  }

  // Start loading the browser's voice list before the first answer arrives.
  synth?.getVoices();

  return {
    cancel,
    async speak(text) {
      cancel();
      const current = generation;
      if (!synth) { onError('Speech is unavailable in this browser. You can read the transcript.'); return; }
      const selected = voice || await waitForVoice();
      if (current !== generation) return;
      voice = selected;
      if (!voice) {
        onError('An English voice could not load. Please try again or read the transcript.');
        return;
      }
      utterance = createUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onstart = () => { if (current === generation) onStart(); };
      utterance.onend = () => {
        if (current !== generation) return;
        utterance = null;
        onEnd();
      };
      utterance.onerror = () => {
        if (current !== generation) return;
        utterance = null;
        onError('Audio playback failed. You can still read the transcript.');
      };
      try { synth.speak(utterance); }
      catch { utterance = null; onError('Audio playback failed. You can still read the transcript.'); }
    },
  };
}
