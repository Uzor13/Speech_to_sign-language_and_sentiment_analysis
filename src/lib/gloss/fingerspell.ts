import type { Alphabet, GlossToken } from './types';

/** Can any part of this word be spelled with the given alphabet? */
export function isFingerspellable(word: string, alphabet: Alphabet): boolean {
  const letters = new Set(alphabet.letters);
  return word.toLowerCase().split('').some((ch) => letters.has(ch));
}

/**
 * Spell a word out letter by letter.
 *
 * This is the floor of the whole system: a word with no clip is never silently
 * skipped, it is spelled. Apostrophes and hyphens are dropped — they have no
 * manual letter.
 */
export function fingerspellWord(word: string, alphabet: Alphabet, index: number): GlossToken {
  const available = new Set(alphabet.letters);
  const letters = word
    .toLowerCase()
    .split('')
    .filter((ch) => available.has(ch));

  return {
    id: `${index}-fs-${letters.join('')}`,
    gloss: `fs:${letters.join('-').toUpperCase()}`,
    kind: 'fingerspell',
    source: [word],
    letters,
    preferFingerspell: true,
  };
}
