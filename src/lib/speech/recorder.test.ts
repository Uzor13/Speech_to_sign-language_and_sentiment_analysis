import { describe, expect, it } from 'vitest';

import { rms, SILENCE_RMS } from './recorder';

/**
 * The silence test only. The recorder itself needs AudioWorklet and a
 * microphone, so it is exercised in a real browser rather than jsdom.
 */
describe('rms', () => {
  it('is zero for digital silence', () => {
    expect(rms(new Float32Array(1000))).toBe(0);
  });

  it('is below the silence threshold for room tone', () => {
    // Very low-amplitude noise is what an open mic in a quiet room produces.
    // Whisper turns that into a confident "you" or "Thank you." if it is sent.
    const quiet = Float32Array.from({ length: 1000 }, () => (Math.random() - 0.5) * 0.002);
    expect(rms(quiet)).toBeLessThan(SILENCE_RMS);
  });

  it('is above the threshold for speech-level audio', () => {
    const speech = Float32Array.from({ length: 1000 }, (_, i) => Math.sin(i / 8) * 0.2);
    expect(rms(speech)).toBeGreaterThan(SILENCE_RMS);
  });

  it('is safe on an empty buffer', () => {
    expect(rms(new Float32Array(0))).toBe(0);
  });
});
