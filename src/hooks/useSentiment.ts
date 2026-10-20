import { useEffect, useMemo, useState } from 'react';

import { analyzeUtterance, EMPTY_SENTIMENT } from '@/lib/sentiment/analyze';
import { explainSentence } from '@/lib/sentiment/explain';
import { loadVaderEngine, NEUTRAL } from '@/lib/sentiment/engine';
import type { SentimentEngine, TokenContribution, UtteranceSentiment } from '@/lib/sentiment/types';
import type { TranscriptSegment } from '@/lib/speech/types';

const PENDING: SentimentEngine = { id: 'pending', score: () => NEUTRAL };

export interface UseSentimentResult {
  sentiment: UtteranceSentiment;
  contributions: TokenContribution[];
  loading: boolean;
}

/**
 * Sentiment for an utterance, with the lexicon loaded lazily.
 *
 * The analysis itself is a `useMemo` over the text, not state — it is derived
 * data and a pure function already computes it.
 */
export function useSentiment(
  text: string,
  asrSegments: TranscriptSegment[] = [],
): UseSentimentResult {
  const [engine, setEngine] = useState<SentimentEngine>(PENDING);

  useEffect(() => {
    let active = true;
    loadVaderEngine().then((loaded) => {
      if (active) setEngine(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const ready = engine.id !== 'pending';

  const sentiment = useMemo(
    () => (ready ? analyzeUtterance(text, engine, { asrSegments }) : EMPTY_SENTIMENT),
    [text, engine, ready, asrSegments],
  );

  const contributions = useMemo(
    () => (ready && text.trim() ? explainSentence(text, engine) : []),
    [text, engine, ready],
  );

  return { sentiment, contributions, loading: !ready };
}
