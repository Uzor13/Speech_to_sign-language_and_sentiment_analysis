import { useCallback, useEffect, useRef, useState } from 'react';

import { describeRecognitionError, getSpeechRecognitionCtor } from '@/lib/speech/support';
import type { RecognitionError, RecognitionStatus, TranscriptSegment } from '@/lib/speech/types';

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  autoRestart?: boolean;
  onFinal?: (segment: TranscriptSegment) => void;
  /** Dependency-injection seam, so tests never need a real recogniser. */
  createRecognition?: () => SpeechRecognitionLike | null;
}

export interface UseSpeechRecognitionResult {
  status: RecognitionStatus;
  isSupported: boolean;
  isListening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  /** Finals plus whatever is currently being said. */
  transcript: string;
  segments: TranscriptSegment[];
  error: RecognitionError | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
  reset: () => void;
}

/** Chrome ends a session after a few seconds of silence; restart, but not forever. */
const RESTART_DELAY_MS = 200;
const RESTART_BUDGET = 6;
const RESTART_WINDOW_MS = 10_000;

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionResult {
  const {
    lang = 'en-US',
    continuous = true,
    interimResults = true,
    autoRestart = true,
    onFinal,
    createRecognition,
  } = options;

  const factory = useCallback((): SpeechRecognitionLike | null => {
    if (createRecognition) return createRecognition();
    const Ctor = getSpeechRecognitionCtor();
    return Ctor ? new Ctor() : null;
  }, [createRecognition]);

  const [isSupported] = useState(() => factory() !== null);
  const [status, setStatus] = useState<RecognitionStatus>(() =>
    factory() !== null ? 'idle' : 'unsupported',
  );
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimTranscript, setInterim] = useState('');
  const [error, setError] = useState<RecognitionError | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const unmountedRef = useRef(false);
  const restartTimesRef = useRef<number[]>([]);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentStartRef = useRef<number>(0);

  // Held in a ref so a changing callback never tears down the recogniser.
  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const safely = useCallback((fn: () => void) => {
    if (!unmountedRef.current) fn();
  }, []);

  const createInstance = useCallback((): SpeechRecognitionLike | null => {
    const recognition = factory();
    if (!recognition) return null;

    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onaudiostart = () => safely(() => setStatus('listening'));

    recognition.onresult = (event) => {
      let interim = '';

      // Start at resultIndex, not 0. Re-reading from the beginning on every
      // event is what duplicates the transcript.
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        const alternative = result[0];
        if (!alternative) continue;

        if (result.isFinal) {
          const now = Date.now();
          const segment: TranscriptSegment = {
            id: `seg-${now}-${i}`,
            text: alternative.transcript.trim(),
            confidence: alternative.confidence,
            isFinal: true,
            startedAt: segmentStartRef.current || now,
            endedAt: now,
          };
          segmentStartRef.current = now;

          if (segment.text) {
            safely(() => setSegments((prev) => [...prev, segment]));
            onFinalRef.current?.(segment);
          }
        } else {
          interim += alternative.transcript;
        }
      }

      // Replaced, never appended: interim results are a running rewrite of the
      // same words, not new ones.
      safely(() => setInterim(interim));
    };

    recognition.onerror = (event) => {
      const described = describeRecognitionError(event.error);
      safely(() => setError(described));
      if (described.terminal) {
        shouldListenRef.current = false;
        safely(() => setStatus('error'));
      }
    };

    recognition.onend = () => {
      safely(() => setInterim(''));

      if (!shouldListenRef.current || !autoRestart) {
        safely(() => setStatus((s) => (s === 'error' ? s : 'idle')));
        return;
      }

      // Budget the restarts, so a recogniser that ends immediately cannot spin.
      const now = Date.now();
      restartTimesRef.current = restartTimesRef.current.filter(
        (t) => now - t < RESTART_WINDOW_MS,
      );
      if (restartTimesRef.current.length >= RESTART_BUDGET) {
        shouldListenRef.current = false;
        safely(() => {
          setStatus('error');
          setError({
            code: 'restart-budget',
            message: 'Speech recognition kept stopping. Try again, or type instead.',
            terminal: true,
          });
        });
        return;
      }
      restartTimesRef.current.push(now);

      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        if (!shouldListenRef.current || unmountedRef.current) return;
        try {
          recognition.start();
        } catch {
          // Already started; nothing to do.
        }
      }, RESTART_DELAY_MS);
    };

    return recognition;
  }, [factory, lang, continuous, interimResults, autoRestart, safely]);

  const start = useCallback(() => {
    if (!isSupported || shouldListenRef.current) return;

    recognitionRef.current ??= createInstance();
    const recognition = recognitionRef.current;
    if (!recognition) return;

    shouldListenRef.current = true;
    restartTimesRef.current = [];
    segmentStartRef.current = Date.now();
    setError(null);
    setStatus('requesting');

    try {
      recognition.start();
    } catch {
      // start() throws if it is already running, which is harmless.
    }
  }, [isSupported, createInstance]);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    setStatus('stopping');
    recognitionRef.current?.stop();
  }, []);

  const abort = useCallback(() => {
    shouldListenRef.current = false;
    setInterim('');
    setStatus('idle');
    recognitionRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setSegments([]);
    setInterim('');
    setError(null);
  }, []);

  // Teardown. abort() rather than stop(), because stop() can still deliver a
  // final result after the component has gone.
  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      shouldListenRef.current = false;
      if (restartTimerRef.current !== null) clearTimeout(restartTimerRef.current);

      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.onstart = null;
        recognition.onaudiostart = null;
        recognition.abort();
      }
      recognitionRef.current = null;
    };
  }, []);

  const finalTranscript = segments.map((s) => s.text).join(' ').trim();

  return {
    status,
    isSupported,
    isListening: status === 'listening' || status === 'requesting',
    finalTranscript,
    interimTranscript,
    transcript: [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim(),
    segments,
    error,
    start,
    stop,
    abort,
    reset,
  };
}
