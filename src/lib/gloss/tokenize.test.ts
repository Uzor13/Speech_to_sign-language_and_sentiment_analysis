import { describe, expect, it } from 'vitest';

import { tokenize } from './tokenize';

const surfaces = (text: string) => tokenize(text).map((t) => t.surface);

describe('tokenize', () => {
  it('keeps a hyphenated word whole', () => {
    expect(surfaces('a well-known fact')).toEqual(['a', 'well-known', 'fact']);
  });

  it('keeps an internal apostrophe', () => {
    expect(surfaces("O'Brien arrived")).toEqual(["O'Brien", 'arrived']);
  });

  it('keeps a decimal together', () => {
    expect(surfaces('it costs 3.5 pounds')).toEqual(['it', 'costs', '3.5', 'pounds']);
  });

  it('keeps an ordinal together', () => {
    expect(surfaces('the 3rd time')).toEqual(['the', '3rd', 'time']);
  });

  it('keeps a dotted acronym as one token rather than three letters', () => {
    expect(surfaces('I know A.S.L. well')).toEqual(['I', 'know', 'A.S.L.', 'well']);
  });

  it('drops surrounding punctuation', () => {
    expect(surfaces('Hello, world!')).toEqual(['Hello', 'world']);
  });

  it('indexes tokens in order and lowercases', () => {
    const tokens = tokenize('The Girl');
    expect(tokens.map((t) => [t.index, t.lower])).toEqual([
      [0, 'the'],
      [1, 'girl'],
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('!!!')).toEqual([]);
  });
});
