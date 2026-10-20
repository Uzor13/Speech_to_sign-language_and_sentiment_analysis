/**
 * vader-sentiment ships a prebuilt webpack UMD bundle with no type
 * definitions and no "exports" field, so its shape is declared here.
 */
declare module 'vader-sentiment' {
  export interface VaderScores {
    neg: number;
    neu: number;
    pos: number;
    /** Normalised aggregate, -1 (most negative) to +1 (most positive). */
    compound: number;
  }

  export const SentimentIntensityAnalyzer: {
    polarity_scores(input: string): VaderScores;
  };

  const _default: {
    SentimentIntensityAnalyzer: typeof SentimentIntensityAnalyzer;
  };
  export default _default;
}
