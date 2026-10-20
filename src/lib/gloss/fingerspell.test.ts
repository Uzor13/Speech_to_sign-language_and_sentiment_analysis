import { describe, expect, it } from 'vitest';

import { fingerspellWord, isFingerspellable } from './fingerspell';
import { ASL_ALPHABET } from './dialects/asl/alphabet';

describe('fingerspellWord', () => {
  it('spells a name letter by letter', () => {
    const result = fingerspellWord('Peter', ASL_ALPHABET, 0);
    expect(result.letters).toEqual(['p', 'e', 't', 'e', 'r']);
    expect(result.gloss).toBe('fs:P-E-T-E-R');
    expect(result.kind).toBe('fingerspell');
  });

  it('drops an apostrophe, which has no manual letter', () => {
    expect(fingerspellWord("O'Brien", ASL_ALPHABET, 0).letters).toEqual([
      'o', 'b', 'r', 'i', 'e', 'n',
    ]);
  });

  it('drops a hyphen', () => {
    expect(fingerspellWord('well-known', ASL_ALPHABET, 0).letters).toHaveLength(9);
  });

  it('returns no letters for empty input', () => {
    expect(fingerspellWord('', ASL_ALPHABET, 0).letters).toEqual([]);
  });

  it('carries the original word as its source', () => {
    expect(fingerspellWord('Peter', ASL_ALPHABET, 0).source).toEqual(['Peter']);
  });
});

describe('isFingerspellable', () => {
  it('is true for a word with letters', () => {
    expect(isFingerspellable('hello', ASL_ALPHABET)).toBe(true);
  });

  it('is false for punctuation only', () => {
    expect(isFingerspellable('!!!', ASL_ALPHABET)).toBe(false);
  });
});

describe('ASL_ALPHABET', () => {
  it('covers all 26 letters and is one-handed', () => {
    expect(ASL_ALPHABET.letters).toHaveLength(26);
    expect(ASL_ALPHABET.twoHanded).toBe(false);
  });

  it('describes every handshape, for the card shown when no image exists', () => {
    for (const letter of ASL_ALPHABET.letters) {
      expect(ASL_ALPHABET.describe(letter).length).toBeGreaterThan(10);
    }
  });
});
