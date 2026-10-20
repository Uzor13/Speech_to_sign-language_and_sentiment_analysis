import type { SignManifest } from '@/lib/signs/types';

/**
 * A deliberately small manifest: one clip with aliases, one number, and one
 * entry pointing at a file that does not exist (to exercise the player's
 * runtime 404 path).
 */
export const TEST_MANIFEST: SignManifest = {
  version: 1,
  basePath: '/signs',
  dialect: 'asl',
  defaults: { clipMs: 1000, letterMs: 400, pauseMs: 250 },
  letters: { dir: 'letters', ext: 'png', available: ['a', 'b', 'c'] },
  entries: [
    { gloss: 'FATHER', file: 'clips/father.mp4', aliases: ['dad', 'papa'], durationMs: 1400 },
    { gloss: 'DRINK', file: 'clips/drink.mp4' },
    { gloss: 'NUMBER-2', file: 'clips/two.mp4' },
    { gloss: 'NUMBER-5', file: 'clips/five.mp4' },
    { gloss: 'GONE', file: 'clips/does-not-exist.mp4' },
  ],
};
