import { describe, expect, it } from 'vitest';

import { loadCompromiseTagger } from './tagger.compromise';
import { englishToGloss, glossToString } from './translate';
import { ASL } from './dialects/asl';

/**
 * The rule tests all run against the heuristic tagger, so they stay fast and
 * unaffected by compromise's tagging changing between versions. This file is
 * the only one that touches the real library — it checks the two things the
 * dependency is actually there for.
 */
describe('compromise tagger', () => {
  it('loads', async () => {
    const tagger = await loadCompromiseTagger();
    expect(tagger.id).toBe('compromise');
  });

  it('still produces the acceptance table', async () => {
    const cases: Array<[string, string]> = [
      ['I am going to the store tomorrow', 'TOMORROW ME GO STORE'],
      ['The girl is drinking water', 'GIRL DRINK WATER'],
      ['Where are you going?', 'YOU GO WHERE WH-Q'],
      ["I don't like apples", 'ME NOT LIKE APPLE'],
    ];

    for (const [english, expected] of cases) {
      const result = await englishToGloss(english, ASL);
      expect(glossToString(result.glosses), english).toBe(expected);
    }
  });

  it('lemmatises an irregular past tense a suffix rule cannot reach', async () => {
    // "GOED" is what a hand-rolled -ed rule produces. This is the reason the
    // dependency exists.
    const result = await englishToGloss('I went home', ASL);
    expect(glossToString(result.glosses)).toBe('ME GO HOME FINISH');
  });

  it('detects a name and spells it rather than inventing a sign', async () => {
    const result = await englishToGloss('My name is Peter', ASL);
    const spelled = result.glosses.find((g) => g.kind === 'fingerspell');
    expect(spelled?.gloss).toBe('fs:P-E-T-E-R');
  });

  it('keeps a modal as its own sign instead of dropping it', async () => {
    const result = await englishToGloss('I must go', ASL);
    expect(glossToString(result.glosses)).toContain('MUST');
  });
});
