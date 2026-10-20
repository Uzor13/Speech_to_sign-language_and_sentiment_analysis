import type { Alphabet } from '../../types';

/**
 * Short handshape descriptions for the one-handed ASL manual alphabet.
 *
 * These are what the fingerspelling card shows when no letter image has been
 * added to public/signs/letters — so the app still teaches something useful
 * with zero assets in the repo.
 */
const HANDSHAPES: Record<string, string> = {
  a: 'Closed fist, thumb alongside the index finger.',
  b: 'Flat hand, fingers together and straight up, thumb folded across the palm.',
  c: 'Hand curved into the shape of a C.',
  d: 'Index finger up, other fingertips meeting the thumb.',
  e: 'Fingertips curled down to touch the thumb, which lies across the palm.',
  f: 'Index finger and thumb touching in a circle, other three fingers up.',
  g: 'Index finger and thumb extended and parallel, pointing sideways.',
  h: 'Index and middle fingers extended together, pointing sideways.',
  i: 'Little finger up, other fingers closed into a fist.',
  j: 'Little finger up, then traced in the shape of a J.',
  k: 'Index and middle fingers up in a V, thumb between them.',
  l: 'Index finger up and thumb out, forming an L.',
  m: 'Thumb tucked under three fingers folded over it.',
  n: 'Thumb tucked under two fingers folded over it.',
  o: 'Fingers and thumb curved to touch, forming an O.',
  p: 'Like K, rotated so the fingers point down.',
  q: 'Like G, rotated so the fingers point down.',
  r: 'Index and middle fingers crossed, pointing up.',
  s: 'Closed fist with the thumb across the front of the fingers.',
  t: 'Thumb tucked between the index and middle fingers.',
  u: 'Index and middle fingers up and together.',
  v: 'Index and middle fingers up and apart, forming a V.',
  w: 'Index, middle and ring fingers up and spread, forming a W.',
  x: 'Index finger up and hooked like a crook.',
  y: 'Thumb and little finger extended, other fingers closed.',
  z: 'Index finger extended, tracing the shape of a Z.',
};

const LETTERS = Object.freeze('abcdefghijklmnopqrstuvwxyz'.split(''));

export const ASL_ALPHABET: Alphabet = {
  id: 'asl',
  letters: LETTERS,
  twoHanded: false,
  describe(letter: string): string {
    return HANDSHAPES[letter.toLowerCase()] ?? '';
  },
};
