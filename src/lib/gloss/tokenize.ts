import type { Token } from './types';

/**
 * Word-level tokenizer.
 *
 * Alternatives in order: dotted acronyms (A.S.L.), decimals and ordinals,
 * plain numbers, then words that may contain an internal hyphen or apostrophe
 * ("well-known", "O'Brien").
 */
const WORD = /[A-Za-z](?:\.[A-Za-z])+\.?|\d+(?:\.\d+)?(?:st|nd|rd|th)?|[A-Za-z]+(?:['-][A-Za-z]+)*/g;

export function tokenize(text: string): Token[] {
  const matches = text.match(WORD) ?? [];
  return matches.map((surface, index) => ({
    surface,
    lower: surface.toLowerCase(),
    index,
    pos: 'other' as const,
    lemma: surface.toLowerCase(),
  }));
}
