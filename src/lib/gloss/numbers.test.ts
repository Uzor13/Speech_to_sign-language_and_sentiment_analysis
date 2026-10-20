import { describe, expect, it } from 'vitest';

import { expandNumbers, numberToGloss } from './numbers';
import { heuristicTagger } from './tagger';
import { tokenize } from './tokenize';
import { ASL } from './dialects/asl';

const glossesFor = (text: string) =>
  expandNumbers(heuristicTagger.tag(tokenize(text), ASL.lexicon, text))
    .filter((t) => t.pos === 'num')
    .map((t) => t.gloss);

describe('expandNumbers', () => {
  it('glosses a digit', () => {
    expect(glossesFor('I have 7 apples')).toEqual(['NUMBER-7']);
  });

  it('glosses a multi-digit number as one value', () => {
    expect(glossesFor('She has 25 cats')).toEqual(['NUMBER-25']);
  });

  it('glosses a spelled-out number', () => {
    expect(glossesFor('I have three apples')).toEqual(['NUMBER-3']);
  });

  it('handles a year', () => {
    expect(glossesFor('born in 1999')).toEqual(['NUMBER-1999']);
  });

  it('handles an ordinal', () => {
    expect(glossesFor('the 3rd time')).toEqual(['NUMBER-3']);
  });

  it('leaves non-numeric tokens alone', () => {
    const tokens = heuristicTagger.tag(tokenize('hello world'), ASL.lexicon, 'hello world');
    expect(expandNumbers(tokens).every((t) => t.gloss === undefined)).toBe(true);
  });
});

describe('numberToGloss', () => {
  it('builds a NUMBER- gloss', () => {
    expect(numberToGloss(25, 0)).toMatchObject({ gloss: 'NUMBER-25', kind: 'number', value: 25 });
  });

  it('rounds a long decimal', () => {
    expect(numberToGloss(3.14159, 0).gloss).toBe('NUMBER-3.14');
  });
});
