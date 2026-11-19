import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorSpeech } from '../src/ai/speech/tutorSpeech.js';

const google = { name: 'Google US English', lang: 'en-US', voiceURI: 'google-us', localService: false };
const samantha = { name: 'Samantha', lang: 'en-US', voiceURI: 'samantha', localService: true };
function setup(initial = [], voiceWaitMs = 100) {
  const synth = new EventTarget();
  synth.voices = initial;
  synth.calls = [];
  synth.getVoices = () => synth.voices;
  synth.cancel = () => {};
  synth.speak = utterance => synth.calls.push(utterance);
  let starts = 0, ends = 0;
  const errors = [];
  const player = createTutorSpeech({ synth, createUtterance: text => ({ text }),
    onStart: () => starts++, onEnd: () => ends++, onError: message => errors.push(message), voiceWaitMs });
  return { synth, player, errors, starts: () => starts, ends: () => ends };
}

test('first reply waits for asynchronously loaded voices and explicitly binds language', async () => {
  const { synth, player } = setup();
  const pending = player.speak('Hello, student.');
  assert.equal(synth.calls.length, 0);
  const british = { ...google, name: 'Google UK English', lang: 'en-GB' };
  synth.voices = [british];
  synth.dispatchEvent(new Event('voiceschanged'));
  await pending;
  assert.equal(synth.calls.length, 1);
  assert.equal(synth.calls[0].voice, british);
  assert.equal(synth.calls[0].lang, 'en-GB');
  player.cancel();
});

test('later replies keep the same voice when voice ordering or available engines change', async () => {
  const { synth, player } = setup([google]);
  await player.speak('First reply.');
  synth.voices = [samantha, google];
  synth.dispatchEvent(new Event('voiceschanged'));
  await player.speak('Second reply.');
  assert.equal(synth.calls[0].voice, google);
  assert.equal(synth.calls[1].voice, google);
  assert.equal(synth.calls[1].rate, 1);
  player.cancel();
});

test('cancelling during voice loading prevents a late reply from being spoken', async () => {
  const { synth, player } = setup();
  const pending = player.speak('Cancelled reply.');
  player.cancel();
  synth.voices = [google];
  synth.dispatchEvent(new Event('voiceschanged'));
  await pending;
  assert.equal(synth.calls.length, 0);
});

test('a cancelled wait cannot overwrite the voice pinned by a newer request', async () => {
  const { synth, player } = setup();
  const pending = player.speak('Old reply.');
  synth.voices = [google];
  const newer = player.speak('New reply.');
  await Promise.all([pending, newer]);
  synth.voices = [samantha];
  await player.speak('Another reply.');
  assert.equal(synth.calls.length, 2);
  assert.equal(synth.calls[1].voice, google);
  player.cancel();
});

test('a cancelled utterance cannot clear the playback state of its replacement', async () => {
  const { synth, player, starts, ends, errors } = setup([google]);
  await player.speak('Old reply.');
  const lateEnd = synth.calls[0].onend;
  const lateError = synth.calls[0].onerror;
  await player.speak('Current reply.');
  synth.calls[1].onstart();
  lateEnd(); lateError();
  assert.equal(starts(), 1);
  assert.equal(ends(), 0);
  assert.deepEqual(errors, []);
  synth.calls[1].onend();
  assert.equal(ends(), 1);
});

test('unavailable voices time out without silently using a changing browser default', async () => {
  const { synth, player, errors } = setup([], 5);
  await player.speak('Read the transcript.');
  assert.equal(synth.calls.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /voice could not load/);
  synth.voices = [google];
  synth.dispatchEvent(new Event('voiceschanged'));
  assert.equal(synth.calls.length, 0);
});

test('unsupported speech fails gracefully', async () => {
  const errors = [];
  const player = createTutorSpeech({ synth: undefined, onError: message => errors.push(message) });
  await player.speak('Hello');
  assert.match(errors[0], /unavailable/);
});
