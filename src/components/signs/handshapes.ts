/**
 * Schematic handshapes for the ASL manual alphabet.
 *
 * Drawn in code rather than shipped as images, so the app can *show* a sign
 * with no assets in the repository at all. They are diagrams, not photographs
 * — enough to see the shape and tell the letters apart. A real letter image
 * added to the manifest always takes precedence.
 */

export type FingerState =
  | 'extended' // straight up, full length
  | 'half' // bent at the middle knuckle
  | 'curled' // folded over towards the palm
  | 'hooked' // bent at the tip only (X)
  | 'folded'; // down against the palm

export type ThumbState =
  | 'across' // lying across the front of the palm (B, E, S)
  | 'side' // alongside the index finger (A)
  | 'out' // sticking out sideways (L, Y, G)
  | 'up' // upright between two fingers (K)
  | 'tucked' // buried under the fingers (M, N, T)
  | 'pinch'; // meeting the fingertips (D, F, O)

export interface HandShape {
  thumb: ThumbState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  /** Fingers held apart rather than together. */
  spread?: boolean;
  /** Index and middle crossed over each other (R). */
  cross?: boolean;
  /** One continuous curve instead of separate fingers (C, O). */
  curve?: 'c' | 'o';
  /** Rotate the whole hand: G and H point sideways, P and Q point down. */
  rotate?: number;
  /** The letters that are a movement, not a pose. */
  motion?: 'j' | 'z';
  /** How many fingers the thumb is tucked beneath (M, N, T). */
  tuckedUnder?: number;
}

const FIST = { index: 'folded', middle: 'folded', ring: 'folded', pinky: 'folded' } as const;
const FLAT = { index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended' } as const;

export const ASL_HANDSHAPES: Record<string, HandShape> = {
  a: { ...FIST, thumb: 'side' },
  b: { ...FLAT, thumb: 'across' },
  c: { ...FLAT, thumb: 'pinch', curve: 'c' },
  d: { index: 'extended', middle: 'curled', ring: 'curled', pinky: 'curled', thumb: 'pinch' },
  e: { index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled', thumb: 'across' },
  f: { index: 'curled', middle: 'extended', ring: 'extended', pinky: 'extended', thumb: 'pinch' },
  g: { index: 'extended', middle: 'folded', ring: 'folded', pinky: 'folded', thumb: 'out', rotate: 90 },
  h: { index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', thumb: 'tucked', rotate: 90 },
  i: { index: 'folded', middle: 'folded', ring: 'folded', pinky: 'extended', thumb: 'across' },
  j: { index: 'folded', middle: 'folded', ring: 'folded', pinky: 'extended', thumb: 'across', motion: 'j' },
  k: { index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', thumb: 'up', spread: true },
  l: { index: 'extended', middle: 'folded', ring: 'folded', pinky: 'folded', thumb: 'out' },
  m: { ...FIST, thumb: 'tucked', tuckedUnder: 3 },
  n: { ...FIST, thumb: 'tucked', tuckedUnder: 2 },
  o: { index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled', thumb: 'pinch', curve: 'o' },
  p: { index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', thumb: 'up', spread: true, rotate: 135 },
  q: { index: 'extended', middle: 'folded', ring: 'folded', pinky: 'folded', thumb: 'out', rotate: 135 },
  r: { index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', thumb: 'across', cross: true },
  s: { ...FIST, thumb: 'across' },
  t: { ...FIST, thumb: 'tucked', tuckedUnder: 1 },
  u: { index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', thumb: 'across' },
  v: { index: 'extended', middle: 'extended', ring: 'folded', pinky: 'folded', thumb: 'across', spread: true },
  w: { index: 'extended', middle: 'extended', ring: 'extended', pinky: 'folded', thumb: 'pinch', spread: true },
  x: { index: 'hooked', middle: 'folded', ring: 'folded', pinky: 'folded', thumb: 'across' },
  y: { index: 'folded', middle: 'folded', ring: 'folded', pinky: 'extended', thumb: 'out' },
  z: { index: 'extended', middle: 'folded', ring: 'folded', pinky: 'folded', thumb: 'across', motion: 'z' },
};

export const getHandShape = (letter: string): HandShape | undefined =>
  ASL_HANDSHAPES[letter.toLowerCase()];
