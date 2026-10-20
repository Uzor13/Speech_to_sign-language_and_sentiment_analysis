import type { SentimentEngine, VaderScores } from './types';

export const NEUTRAL: VaderScores = { neg: 0, neu: 1, pos: 0, compound: 0 };

type AnalyzerLike = { polarity_scores(input: string): VaderScores };

let cached: Promise<SentimentEngine> | null = null;

/**
 * Load VADER.
 *
 * VADER rather than AFINN because AFINN is a bare lexicon sum: "not good"
 * scores *positive* under it, since only "good" is in the lexicon. VADER
 * applies a negation window, intensifiers ("really good" > "good") and
 * but-contrast — all of which survive transcription and all of which turn up
 * constantly in speech. Its caps and punctuation heuristics are no-ops on
 * recogniser output, but those were never the point.
 *
 * The package has no ESM build, so the interop is handled here and nothing
 * else in the codebase needs to know.
 */
export function loadVaderEngine(): Promise<SentimentEngine> {
  cached ??= import('vader-sentiment')
    .then((mod) => {
      const candidate =
        (mod as unknown as { SentimentIntensityAnalyzer?: AnalyzerLike })
          .SentimentIntensityAnalyzer ??
        (mod as unknown as { default?: { SentimentIntensityAnalyzer?: AnalyzerLike } }).default
          ?.SentimentIntensityAnalyzer;

      if (!candidate?.polarity_scores) throw new Error('vader-sentiment did not load');

      return {
        id: 'vader',
        score: (text: string) => (text.trim() ? candidate.polarity_scores(text) : NEUTRAL),
      } satisfies SentimentEngine;
    })
    .catch(() => ({
      id: 'unavailable',
      score: () => NEUTRAL,
    }));

  return cached;
}

/** A deterministic engine for tests, driven by a tiny word list. */
export function createFakeEngine(lexicon: Record<string, number>): SentimentEngine {
  return {
    id: 'fake',
    score(text) {
      const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
      let sum = 0;
      words.forEach((word, i) => {
        const value = lexicon[word] ?? 0;
        const negated = words.slice(Math.max(0, i - 3), i).some((w) => w === 'not' || w === 'no');
        sum += negated ? -value : value;
      });
      const compound = Math.max(-1, Math.min(1, sum / 4));
      return {
        neg: compound < 0 ? Math.abs(compound) : 0,
        pos: compound > 0 ? compound : 0,
        neu: 1 - Math.abs(compound),
        compound,
      };
    },
  };
}

/** Tests only. */
export function __resetEngineCache(): void {
  cached = null;
}
