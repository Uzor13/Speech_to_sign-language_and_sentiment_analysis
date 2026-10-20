import { describe, expect, it } from 'vitest';

import { expandContractions, normalizeText, stripFillers } from './normalize';

describe('expandContractions', () => {
  it.each([
    ["I'm not sure", 'I am not sure'],
    ["don't stop", 'do not stop'],
    ["won't work", 'will not work'],
    ["can't see", 'can not see'],
    ["I've been there", 'I have been there'],
    ["you're late", 'you are late'],
    ["they'll come", 'they will come'],
    ["it's here", 'it is here'],
    ["didn't eat", 'did not eat'],
  ])('%s -> %s', (input, expected) => {
    expect(expandContractions(input)).toBe(expected);
  });

  it('normalises a curly apostrophe', () => {
    expect(expandContractions('I’m here')).toBe('I am here');
  });

  it("leaves a genuine possessive 's alone for the possessives rule", () => {
    expect(expandContractions("Peter's book")).toBe("Peter's book");
  });
});

describe('stripFillers', () => {
  it('removes hesitation sounds', () => {
    expect(stripFillers('I am, um, not sure')).toBe('I am, not sure');
  });

  it('keeps "like" because it is also a verb', () => {
    expect(stripFillers('I like apples')).toBe('I like apples');
  });
});

describe('normalizeText', () => {
  it('expands, strips and collapses in one pass, preserving case', () => {
    // Case is preserved on purpose: proper-noun detection decides what gets
    // fingerspelled, and lowercasing would destroy it.
    expect(normalizeText("I'm not, um, sure")).toBe('I am not, sure');
  });

  it('is safe on empty input', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText('   ')).toBe('');
  });

  it('can be told to keep fillers', () => {
    expect(normalizeText('um hello', { stripFillers: false })).toBe('um hello');
  });
});
