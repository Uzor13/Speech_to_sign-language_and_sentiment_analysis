export interface VaderScores {
  neg: number;
  neu: number;
  pos: number;
  /** Normalised aggregate, -1 to +1. */
  compound: number;
}

export type SentimentLabel = 'positive' | 'negative' | 'neutral';

export interface SentenceSentiment {
  id: string;
  index: number;
  text: string;
  /** Offsets into the source text, so the UI can highlight in place. */
  charStart: number;
  charEnd: number;
  scores: VaderScores;
  label: SentimentLabel;
  /** Set when the sentence came from a speech-recognition segment. */
  asrSegmentId?: string;
  confidence?: number;
}

export interface ArcPoint {
  index: number;
  charStart: number;
  compound: number;
  label: SentimentLabel;
  text: string;
}

export interface UtteranceSentiment {
  sentences: SentenceSentiment[];
  /** VADER over the whole text, which is what it is calibrated for. */
  documentScores: VaderScores;
  documentLabel: SentimentLabel;
  /** Length-weighted mean of the per-sentence compounds. */
  weightedMean: number;
  arc: ArcPoint[];
  extremes: { mostPositive?: SentenceSentiment; mostNegative?: SentenceSentiment };
  /**
   * Standard deviation of the per-sentence compounds: the "mixed feelings"
   * detector. A single average flattens "I loved it but the ending was awful"
   * to neutral; this is what shows that it was not.
   */
  volatility: number;
}

export interface TokenContribution {
  token: string;
  index: number;
  /** How much the sentence's compound score drops without this word. */
  delta: number;
}

export interface SentimentEngine {
  id: string;
  score(text: string): VaderScores;
}
