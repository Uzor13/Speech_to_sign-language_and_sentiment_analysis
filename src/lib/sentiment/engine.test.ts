import { describe, expect, it } from 'vitest';

import { loadVaderEngine } from './engine';
import { analyzeUtterance } from './analyze';

/**
 * Exercises the real package. vader-sentiment ships only a prebuilt UMD
 * bundle with no ESM entry, so the interop is worth pinning down.
 */
describe('vader engine (real package)', () => {
  it('loads through the CJS interop', async () => {
    const engine = await loadVaderEngine();
    expect(engine.id).toBe('vader');
  });

  it('scores "not good" as negative', async () => {
    // The whole justification for choosing VADER over AFINN: a bare lexicon
    // sum scores this positive, because only "good" is in the lexicon.
    const engine = await loadVaderEngine();
    expect(engine.score('not good').compound).toBeLessThan(0);
    expect(engine.score('good').compound).toBeGreaterThan(0);
  });

  it('respects intensifiers', async () => {
    const engine = await loadVaderEngine();
    expect(engine.score('really good').compound).toBeGreaterThan(
      engine.score('good').compound,
    );
  });

  it('handles but-contrast, weighting the later clause', async () => {
    const engine = await loadVaderEngine();
    const result = engine.score('the food was fine but the wait was awful');
    expect(result.compound).toBeLessThan(0);
  });

  it('produces a positive-to-negative arc over a mixed utterance', async () => {
    const engine = await loadVaderEngine();
    const result = analyzeUtterance('I love this but the ending was terrible', engine);

    expect(result.arc).toHaveLength(2);
    expect(result.arc[0]?.label).toBe('positive');
    expect(result.arc[1]?.label).toBe('negative');
    expect(result.volatility).toBeGreaterThan(0);
  });

  it('is neutral on empty input', async () => {
    const engine = await loadVaderEngine();
    expect(engine.score('').compound).toBe(0);
  });
});
