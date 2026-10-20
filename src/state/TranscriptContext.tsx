import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { TranscriptSegment } from '@/lib/speech/types';

export type TranscriptSource = 'speech' | 'typed' | null;

export interface TranscriptState {
  text: string;
  segments: TranscriptSegment[];
  source: TranscriptSource;
  setText: (text: string, source?: Exclude<TranscriptSource, null>) => void;
  appendSegment: (segment: TranscriptSegment) => void;
  clear: () => void;
}

const TranscriptContext = createContext<TranscriptState | null>(null);

/**
 * The one piece of cross-route state. It exists so "analyse what I just said"
 * can carry a transcript from /speech to /sentiment — you cannot prop-drill
 * through an <Outlet/>, and everything else here is either local to a page or
 * derived from this text by a pure function.
 */
export function TranscriptProvider({ children }: { children: ReactNode }) {
  const [text, setTextRaw] = useState('');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [source, setSource] = useState<TranscriptSource>(null);

  const setText = useCallback((next: string, nextSource: Exclude<TranscriptSource, null> = 'typed') => {
    setTextRaw(next);
    setSource(nextSource);
    // Typed text has no ASR segmentation; drop stale segments so the sentiment
    // layer falls back to punctuation rather than mismatched breath groups.
    if (nextSource === 'typed') setSegments([]);
  }, []);

  const appendSegment = useCallback((segment: TranscriptSegment) => {
    setSegments((prev) => [...prev, segment]);
    setSource('speech');
    setTextRaw((prev) => (prev ? `${prev} ${segment.text}`.trim() : segment.text));
  }, []);

  const clear = useCallback(() => {
    setTextRaw('');
    setSegments([]);
    setSource(null);
  }, []);

  const value = useMemo<TranscriptState>(
    () => ({ text, segments, source, setText, appendSegment, clear }),
    [text, segments, source, setText, appendSegment, clear],
  );

  return <TranscriptContext.Provider value={value}>{children}</TranscriptContext.Provider>;
}

export function useTranscript(): TranscriptState {
  const ctx = useContext(TranscriptContext);
  if (!ctx) throw new Error('useTranscript must be used inside a <TranscriptProvider>');
  return ctx;
}
