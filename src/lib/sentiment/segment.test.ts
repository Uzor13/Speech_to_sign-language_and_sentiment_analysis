import { describe, expect, it } from 'vitest';

import { segmentSentences } from './segment';
import type { TranscriptSegment } from '@/lib/speech/types';

const asr = (id: string, text: string): TranscriptSegment => ({
  id,
  text,
  confidence: 0.9,
  isFinal: true,
  startedAt: 0,
  endedAt: 1,
});

describe('segmentSentences', () => {
  it('splits on terminal punctuation when there is any', () => {
    const text = 'I love this. The ending was awful. What a shame!';
    expect(segmentSentences(text).map((s) => s.text)).toEqual([
      'I love this.',
      'The ending was awful.',
      'What a shame!',
    ]);
  });

  it('uses the recogniser’s own finals when there is no punctuation', () => {
    // Speech recognition emits no punctuation, so breath groups are the best
    // sentence proxy available.
    const text = 'I love this the ending was awful what a shame';
    const sentences = segmentSentences(text, {
      asrSegments: [
        asr('a', 'I love this'),
        asr('b', 'the ending was awful'),
        asr('c', 'what a shame'),
      ],
    });

    expect(sentences.map((s) => s.text)).toEqual([
      'I love this',
      'the ending was awful',
      'what a shame',
    ]);
    expect(sentences[0]?.asrSegmentId).toBe('a');
  });

  it('splits a long unpunctuated run on a discourse marker', () => {
    const text = 'the food was really good but the service was incredibly slow';
    const sentences = segmentSentences(text);

    expect(sentences).toHaveLength(2);
    expect(sentences[1]?.text).toMatch(/^but/);
  });

  it('caps the length of a run with no markers at all', () => {
    const text = Array.from({ length: 45 }, (_, i) => `word${i}`).join(' ');
    const sentences = segmentSentences(text, { maxWords: 20 });
    expect(sentences.length).toBeGreaterThan(1);
    for (const s of sentences) {
      expect(s.text.split(/\s+/).length).toBeLessThanOrEqual(20);
    }
  });

  it('returns offsets that round-trip against the source', () => {
    // The UI highlights the sentence in place, so these must be exact.
    const text = 'I love this. The ending was awful.';
    for (const sentence of segmentSentences(text)) {
      expect(text.slice(sentence.charStart, sentence.charEnd)).toBe(sentence.text);
    }
  });

  it('returns nothing for empty input', () => {
    expect(segmentSentences('')).toEqual([]);
    expect(segmentSentences('   ')).toEqual([]);
  });

  it('prefers punctuation over ASR segments when both are available', () => {
    const sentences = segmentSentences('One. Two.', { asrSegments: [asr('a', 'One. Two.')] });
    expect(sentences).toHaveLength(2);
  });
});
