import { describe, expect, it } from 'vitest';

import { buildSequence } from './sequence';
import { coverageFor } from './coverage';
import { createEmptyRegistry, createRegistry } from './registry';
import { TEST_MANIFEST } from '@/test/fixtures/manifest';
import { ASL_ALPHABET } from '@/lib/gloss/dialects/asl/alphabet';
import { englishToGlossSync } from '@/lib/gloss/translate';
import { ASL } from '@/lib/gloss/dialects/asl';
import type { GlossToken } from '@/lib/gloss/types';

const registry = createRegistry(TEST_MANIFEST, ASL_ALPHABET);
const empty = createEmptyRegistry(ASL_ALPHABET);

const sign = (gloss: string, source: string[]): GlossToken => ({
  id: `t-${gloss}`,
  gloss,
  kind: 'sign',
  source,
});

describe('buildSequence', () => {
  it('keeps clips and spelled letters in one timeline, in order', () => {
    const { steps } = buildSequence(
      [sign('FATHER', ['father']), sign('ABC', ['abc']), sign('DRINK', ['drink'])],
      registry,
    );

    expect(steps.map((s) => s.kind)).toEqual([
      'video',
      'letter',
      'letter',
      'letter',
      'video',
    ]);
    expect(steps[0]).toMatchObject({ gloss: 'FATHER' });
    expect(steps[4]).toMatchObject({ gloss: 'DRINK' });
  });

  it('sums the durations it reports', () => {
    const sequence = buildSequence([sign('FATHER', ['father']), sign('ABC', ['abc'])], registry);
    const summed = sequence.steps.reduce((total, s) => total + s.durationMs, 0);
    expect(sequence.totalEstimatedMs).toBe(summed);
    // 1400 for the clip plus three letters at 400
    expect(sequence.totalEstimatedMs).toBe(1400 + 3 * 400);
  });

  it('counts clips and spelled words separately', () => {
    const sequence = buildSequence([sign('FATHER', ['father']), sign('APPLE', ['apple'])], registry);
    expect(sequence.clipCount).toBe(1);
    expect(sequence.fingerspelledCount).toBe(1);
  });

  it('numbers the letters within a word, for the "3 of 5" caption', () => {
    const { steps } = buildSequence([sign('ABC', ['abc'])], registry);
    const letters = steps.filter((s) => s.kind === 'letter');
    expect(letters.map((s) => (s.kind === 'letter' ? s.position : null))).toEqual([
      { index: 1, total: 3 },
      { index: 2, total: 3 },
      { index: 3, total: 3 },
    ]);
  });

  it('attaches a letter image when one exists and omits it when not', () => {
    const { steps } = buildSequence([sign('AZ', ['az'])], registry);
    const letters = steps.filter((s) => s.kind === 'letter');
    expect(letters[0]).toMatchObject({ letter: 'a', src: '/signs/letters/a.png' });
    expect(letters[1]?.kind === 'letter' && letters[1].src).toBeUndefined();
  });

  it('inserts a pause between clauses', () => {
    const { glosses } = englishToGlossSync('I went home. I am tired.', ASL);
    const { steps } = buildSequence(glosses, registry);
    expect(steps.filter((s) => s.kind === 'pause')).toHaveLength(1);
  });

  it('skips grammar markers, which are carried on the face, without reporting them missing', () => {
    const { glosses } = englishToGlossSync('Where are you going?', ASL);
    const sequence = buildSequence(glosses, registry);
    expect(sequence.steps.some((s) => s.kind !== 'pause' && s.gloss === 'WH-Q')).toBe(false);
    expect(sequence.unresolved).toEqual([]);
  });

  it('handles an empty gloss list without crashing', () => {
    const sequence = buildSequence([], registry);
    expect(sequence.steps).toEqual([]);
    expect(sequence.totalEstimatedMs).toBe(0);
  });

  it('spells every word when the manifest is empty — never a blank timeline', () => {
    // The regression the old implementation could not pass: with no assets it
    // rendered nothing at all.
    const { glosses } = englishToGlossSync("I don't like apples", ASL);
    const sequence = buildSequence(glosses, empty);

    expect(sequence.steps.length).toBeGreaterThan(0);
    expect(sequence.steps.every((s) => s.kind === 'letter' || s.kind === 'pause')).toBe(true);
    expect(sequence.clipCount).toBe(0);
    expect(sequence.unresolved).toEqual([]);
  });
});

describe('coverageFor', () => {
  it('reports the share of words with real clips', () => {
    const report = coverageFor([sign('FATHER', ['father']), sign('APPLE', ['apple'])], registry);
    expect(report).toMatchObject({ total: 2, withClips: 1, fingerspelled: 1, percent: 50 });
    expect(report.missing).toEqual(['APPLE']);
  });

  it('reports zero coverage against an empty manifest', () => {
    const report = coverageFor([sign('FATHER', ['father'])], empty);
    expect(report).toMatchObject({ withClips: 0, percent: 0 });
  });

  it('ignores markers and pauses', () => {
    const { glosses } = englishToGlossSync('Where are you going?', ASL);
    const report = coverageFor(glosses, registry);
    expect(report.total).toBe(glosses.filter((g) => g.kind === 'sign').length);
  });

  it('is zero, not NaN, for an empty utterance', () => {
    expect(coverageFor([], registry).percent).toBe(0);
  });
});
