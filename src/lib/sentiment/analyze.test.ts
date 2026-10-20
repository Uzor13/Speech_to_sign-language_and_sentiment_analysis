import { describe, expect, it } from 'vitest';

import { analyzeUtterance, labelFor } from './analyze';
import { explainSentence } from './explain';
import { createFakeEngine } from './engine';

const engine = createFakeEngine({
  love: 3,
  loved: 3,
  good: 2,
  great: 3,
  awful: -3,
  terrible: -3,
  slow: -1,
  fine: 1,
});

describe('labelFor', () => {
  it('uses VADER’s documented thresholds', () => {
    expect(labelFor(0.5)).toBe('positive');
    expect(labelFor(-0.5)).toBe('negative');
    expect(labelFor(0)).toBe('neutral');
    expect(labelFor(0.04)).toBe('neutral');
  });
});

describe('analyzeUtterance', () => {
  it('scores each sentence separately, producing an arc', () => {
    const result = analyzeUtterance('I love this. The service was terrible.', engine);

    expect(result.sentences).toHaveLength(2);
    expect(result.sentences[0]?.label).toBe('positive');
    expect(result.sentences[1]?.label).toBe('negative');
    expect(result.arc).toHaveLength(2);
  });

  it('flags a mixed utterance with volatility, which one average hides', () => {
    const mixed = analyzeUtterance('I love this. The service was terrible.', engine);
    const flat = analyzeUtterance('It was fine. It was fine.', engine);

    expect(mixed.volatility).toBeGreaterThan(flat.volatility);
    expect(mixed.volatility).toBeGreaterThan(0);
  });

  it('names the most positive and most negative sentences', () => {
    const result = analyzeUtterance('I love this. It was fine. The service was terrible.', engine);
    expect(result.extremes.mostPositive?.text).toBe('I love this.');
    expect(result.extremes.mostNegative?.text).toBe('The service was terrible.');
  });

  it('weights the mean by sentence length', () => {
    const result = analyzeUtterance('Good. The service was absolutely terrible today.', engine);
    expect(result.weightedMean).toBeLessThan(0);
  });

  it('returns neutral with no NaN anywhere for empty input', () => {
    const result = analyzeUtterance('   ', engine);
    expect(result.sentences).toEqual([]);
    expect(result.documentLabel).toBe('neutral');
    expect(Number.isNaN(result.volatility)).toBe(false);
    expect(Number.isNaN(result.weightedMean)).toBe(false);
  });

  it('carries recogniser segment ids through to the sentences', () => {
    const result = analyzeUtterance('I love this the service was terrible', engine, {
      asrSegments: [
        { id: 'a', text: 'I love this', confidence: 0.9, isFinal: true, startedAt: 0, endedAt: 1 },
        {
          id: 'b',
          text: 'the service was terrible',
          confidence: 0.8,
          isFinal: true,
          startedAt: 1,
          endedAt: 2,
        },
      ],
    });

    expect(result.sentences.map((s) => s.asrSegmentId)).toEqual(['a', 'b']);
  });
});

describe('negation — the reason VADER is used instead of AFINN', () => {
  it('scores "not good" as negative', () => {
    // A bare AFINN sum scores this POSITIVE, because only "good" is in the
    // lexicon. Getting this backwards in a demo is fatal, so it is pinned.
    expect(engine.score('not good').compound).toBeLessThan(0);
  });

  it('keeps plain "good" positive', () => {
    expect(engine.score('good').compound).toBeGreaterThan(0);
  });
});

describe('explainSentence', () => {
  it('attributes the score to the words that caused it', () => {
    const contributions = explainSentence('the service was terrible', engine);
    expect(contributions[0]?.token).toBe('terrible');
    expect(contributions[0]?.delta).toBeLessThan(0);
  });

  it('shows a negated word contributing negatively', () => {
    // Removing "good" from "not good" removes the thing being negated, so its
    // contribution is negative — which a raw lexicon lookup would get wrong.
    const contributions = explainSentence('not good', engine);
    const good = contributions.find((c) => c.token === 'good');
    expect(good?.delta).toBeLessThan(0);
  });

  it('returns nothing for empty input', () => {
    expect(explainSentence('', engine)).toEqual([]);
  });
});
