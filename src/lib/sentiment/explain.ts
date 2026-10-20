import type { SentimentEngine, TokenContribution } from './types';

/**
 * Attribute a sentence's score to individual words by leave-one-out ablation:
 * score the sentence, then rescore it with each word removed, and take the
 * difference.
 *
 * This costs N+1 lexicon lookups — microseconds — and unlike reading the raw
 * lexicon it accounts for negation and intensifiers. In "not good", `good`
 * correctly shows a *negative* contribution, because removing it removes the
 * thing being negated. It is the honest way to get per-word detail out of a
 * library that exposes no internals.
 */
export function explainSentence(text: string, engine: SentimentEngine): TokenContribution[] {
  const tokens = text.match(/[\w']+/g) ?? [];
  if (tokens.length === 0) return [];

  const baseline = engine.score(text).compound;

  return tokens
    .map((token, index) => {
      const without = tokens.filter((_, i) => i !== index).join(' ');
      const delta = baseline - engine.score(without).compound;
      return { token, index, delta: Number(delta.toFixed(4)) };
    })
    .filter((c) => Math.abs(c.delta) > 0.0001)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
