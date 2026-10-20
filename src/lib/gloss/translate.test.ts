import { describe, expect, it } from 'vitest';

import { englishToGlossSync, glossToString } from './translate';
import { ASL } from './dialects/asl';
import { heuristicTagger } from './tagger';

const gloss = (text: string, options = {}) =>
  glossToString(englishToGlossSync(text, ASL, heuristicTagger, options).glosses);

describe('englishToGloss — ASL grammar', () => {
  // This table is the acceptance criteria for the translation layer.
  const CASES: Array<[english: string, expected: string]> = [
    ['I am going to the store tomorrow', 'TOMORROW ME GO STORE'],
    ['The girl is drinking water', 'GIRL DRINK WATER'],
    ['My father is not here', 'MY FATHER HERE NOT'],
    ['Where are you going?', 'YOU GO WHERE WH-Q'],
    ['Did you eat the apple?', 'YOU EAT APPLE Y/N-Q'],
    ['I went home', 'ME GO HOME FINISH'],
    ['She has 25 cats', 'SHE HAVE NUMBER-25 CAT'],
    ["I don't like apples", 'ME NOT LIKE APPLE'],
  ];

  it.each(CASES)('%s -> %s', (english, expected) => {
    expect(gloss(english)).toBe(expected);
  });

  it('fingerspells a name', () => {
    expect(gloss('My name is Peter')).toBe('MY NAME fs:P-E-T-E-R');
  });
});

describe('englishToGloss — invariants', () => {
  const SAMPLES = [
    'I am going to the store tomorrow',
    'Where are you going?',
    "I don't like apples",
    'She has 25 cats. My name is Peter.',
  ];

  it.each(SAMPLES)('produces no empty gloss for %s', (text) => {
    const { glosses } = englishToGlossSync(text, ASL, heuristicTagger);
    expect(glosses.every((g) => g.gloss.length > 0)).toBe(true);
  });

  it.each(SAMPLES)('produces unique ids for %s', (text) => {
    const { glosses } = englishToGlossSync(text, ASL, heuristicTagger);
    const ids = glosses.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(SAMPLES)('is deterministic for %s', (text) => {
    const a = englishToGlossSync(text, ASL, heuristicTagger);
    const b = englishToGlossSync(text, ASL, heuristicTagger);
    expect(glossToString(a.glosses)).toBe(glossToString(b.glosses));
  });

  it('explains every word it drops', () => {
    const { notes, clauses } = englishToGlossSync('The girl is drinking water', ASL, heuristicTagger);
    const dropped = clauses.flatMap((c) => c.tokens.filter((t) => t.dropped));

    expect(dropped.length).toBeGreaterThan(0);
    for (const token of dropped) {
      expect(token.droppedBy).toBeTruthy();
      expect(notes.some((n) => n.tokenIndex === token.index)).toBe(true);
    }
  });

  it('separates sentences with a pause', () => {
    const { glosses } = englishToGlossSync('I went home. I am tired.', ASL, heuristicTagger);
    expect(glosses.filter((g) => g.kind === 'pause')).toHaveLength(1);
  });

  it('returns an empty result for empty input', () => {
    const result = englishToGlossSync('   ', ASL, heuristicTagger);
    expect(result.glosses).toEqual([]);
    expect(result.clauses).toEqual([]);
  });

  it('detects an unpunctuated question, as speech recognition emits it', () => {
    // ASR never produces a "?" — the wh-word has to be enough.
    expect(gloss('where are you going')).toBe('YOU GO WHERE WH-Q');
  });

  it('leaves topic-comment reordering off by default', () => {
    expect(gloss('I like apples')).toBe('ME LIKE APPLE');
    expect(gloss('I like apples', { topicComment: true })).toBe('APPLE ME LIKE');
  });
});
