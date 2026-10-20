import { segmentSentences, type SegmentOptions } from './segment';
import { NEUTRAL } from './engine';
import type {
  ArcPoint,
  SentenceSentiment,
  SentimentEngine,
  SentimentLabel,
  UtteranceSentiment,
} from './types';

/** VADER's own documented thresholds. */
export const POSITIVE_THRESHOLD = 0.05;
export const NEGATIVE_THRESHOLD = -0.05;

export function labelFor(compound: number): SentimentLabel {
  if (compound >= POSITIVE_THRESHOLD) return 'positive';
  if (compound <= NEGATIVE_THRESHOLD) return 'negative';
  return 'neutral';
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export const EMPTY_SENTIMENT: UtteranceSentiment = {
  sentences: [],
  documentScores: NEUTRAL,
  documentLabel: 'neutral',
  weightedMean: 0,
  arc: [],
  extremes: {},
  volatility: 0,
};

/**
 * Score an utterance overall *and* sentence by sentence.
 *
 * The per-sentence arc is the point: a single number flattens "I loved it but
 * the ending was awful" into neutral, which is exactly the failure mode of the
 * old single-score card.
 */
export function analyzeUtterance(
  text: string,
  engine: SentimentEngine,
  options: SegmentOptions = {},
): UtteranceSentiment {
  const source = text.trim();
  if (!source) return EMPTY_SENTIMENT;

  const sentences: SentenceSentiment[] = segmentSentences(source, options).map((s, index) => {
    const scores = engine.score(s.text);
    return {
      id: `sent-${index}`,
      index,
      text: s.text,
      charStart: s.charStart,
      charEnd: s.charEnd,
      scores,
      label: labelFor(scores.compound),
      ...(s.asrSegmentId ? { asrSegmentId: s.asrSegmentId } : {}),
      ...(s.confidence !== undefined ? { confidence: s.confidence } : {}),
    };
  });

  const documentScores = engine.score(source);

  const totalLength = sentences.reduce((sum, s) => sum + s.text.length, 0);
  const weightedMean =
    totalLength === 0
      ? 0
      : sentences.reduce((sum, s) => sum + s.scores.compound * s.text.length, 0) / totalLength;

  const arc: ArcPoint[] = sentences.map((s) => ({
    index: s.index,
    charStart: s.charStart,
    compound: s.scores.compound,
    label: s.label,
    text: s.text,
  }));

  const sorted = [...sentences].sort((a, b) => b.scores.compound - a.scores.compound);
  const mostPositive = sorted[0];
  const mostNegative = sorted[sorted.length - 1];

  return {
    sentences,
    documentScores,
    documentLabel: labelFor(documentScores.compound),
    weightedMean,
    arc,
    extremes: {
      ...(mostPositive && mostPositive.scores.compound > 0 ? { mostPositive } : {}),
      ...(mostNegative && mostNegative.scores.compound < 0 ? { mostNegative } : {}),
    },
    volatility: standardDeviation(sentences.map((s) => s.scores.compound)),
  };
}
