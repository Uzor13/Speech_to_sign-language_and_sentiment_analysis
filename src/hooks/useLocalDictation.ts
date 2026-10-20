import { useCallback, useEffect, useRef, useState } from 'react';

import { startRecorder, type Recorder } from '@/lib/speech/recorder';
import {
  DEFAULT_WHISPER_MODEL,
  type WhisperRequest,
  type WhisperResponse,
} from '@/lib/speech/localTypes';
import type { RecognitionError, RecognitionStatus, TranscriptSegment } from '@/lib/speech/types';

export interface LocalDictationState {
  status: RecognitionStatus;
  /** 0–100 while the model downloads; null once ready. */
  loadProgress: number | null;
  ready: boolean;
  device: 'webgpu' | 'wasm' | null;
  isListening: boolean;
  finalTranscript: string;
  interimTranscript: string;
  transcript: string;
  segments: TranscriptSegment[];
  error: RecognitionError | null;
  /** Seconds captured in the current utterance, for the level display. */
  elapsed: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/** Re-transcribe the growing utterance this often, for live-ish captions. */
const REFRESH_MS = 1500;
/** Commit a segment after this much trailing silence. */
const SILENCE_COMMIT_MS = 900;
/**
 * Commit regardless beyond this length. Kept short on purpose: every pass
 * re-transcribes the whole utterance, so a long buffer is both slow and far
 * likelier to send Whisper into a repetition loop.
 */
const MAX_UTTERANCE_SECONDS = 10;
/** Ignore anything shorter than this; it is a cough, not a sentence. */
const MIN_UTTERANCE_SECONDS = 0.4;

/**
 * Speech recognition that runs entirely on this machine.
 *
 * Whisper is not a streaming model — it transcribes a whole clip — so live
 * captions come from re-running it over the growing utterance every second or
 * so and replacing the interim text. A stretch of silence (or a hard length
 * cap) commits that utterance as a final segment and starts the next one,
 * which is what keeps each pass short enough to feel responsive.
 */
export function useLocalDictation(
  options: { model?: string; onFinal?: (segment: TranscriptSegment) => void } = {},
): LocalDictationState {
  const { model = DEFAULT_WHISPER_MODEL, onFinal } = options;

  const [status, setStatus] = useState<RecognitionStatus>('idle');
  // State, not just the ref below: the ref drives the async logic, but the
  // button needs a render to flip, and a ref change does not cause one.
  const [listening, setListening] = useState(false);
  const [loadProgress, setProgress] = useState<number | null>(null);
  const [device, setDevice] = useState<'webgpu' | 'wasm' | null>(null);
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [interimTranscript, setInterim] = useState('');
  const [error, setError] = useState<RecognitionError | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);
  const listeningRef = useRef(false);
  const busyRef = useRef(false);
  const requestRef = useRef(0);
  const silenceSinceRef = useRef<number | null>(null);
  const utteranceStartRef = useRef(0);

  // Mirrored in a ref so the commit path can read the newest text directly.
  // Reading it inside a setState updater made committing a side effect of
  // rendering, which React is free to run twice.
  const interimRef = useRef('');
  const writeInterim = useCallback(
    (text: string) => {
      interimRef.current = text;
      if (!unmountedRef.current) setInterim(text);
    },
    [],
  );

  const onFinalRef = useRef(onFinal);
  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  const safely = useCallback((fn: () => void) => {
    if (!unmountedRef.current) fn();
  }, []);

  /** Spawn the worker on first use, so nothing downloads until asked. */
  const getWorker = useCallback((): Worker => {
    if (workerRef.current) return workerRef.current;

    const worker = new Worker(new URL('../workers/whisper.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.addEventListener('message', (event: MessageEvent<WhisperResponse>) => {
      const message = event.data;

      switch (message.type) {
        case 'loading':
          safely(() => setProgress(message.progress));
          break;

        case 'ready':
          readyRef.current = true;
          safely(() => {
            setProgress(null);
            setDevice(message.device);
            setStatus(listeningRef.current ? 'listening' : 'idle');
          });
          break;

        case 'result':
          busyRef.current = false;
          // Ignore anything but the newest request: an earlier, shorter pass
          // finishing late would otherwise overwrite better text.
          if (message.id !== requestRef.current) break;
          writeInterim(message.text);
          break;

        case 'error':
          busyRef.current = false;
          safely(() => {
            setError({ code: 'local-model', message: message.message, terminal: message.fatal });
            if (message.fatal) {
              listeningRef.current = false;
              setListening(false);
              setStatus('error');
            }
          });
          break;

        default:
          break;
      }
    });

    workerRef.current = worker;
    return worker;
  }, [safely, writeInterim]);

  const send = useCallback((message: WhisperRequest) => {
    getWorker().postMessage(message);
  }, [getWorker]);

  /** Turn whatever has been transcribed so far into a committed segment. */
  const commit = useCallback(() => {
    const trimmed = interimRef.current.trim();
    if (!trimmed) return;

    const now = Date.now();
    const segment: TranscriptSegment = {
      id: `local-${now}-${Math.random().toString(36).slice(2, 7)}`,
      text: trimmed,
      // Whisper reports no per-utterance confidence, and inventing one would
      // be worse than admitting there isn't one.
      confidence: 0,
      isFinal: true,
      startedAt: utteranceStartRef.current || now,
      endedAt: now,
    };

    writeInterim('');
    safely(() => setSegments((prev) => [...prev, segment]));
    onFinalRef.current?.(segment);
    utteranceStartRef.current = now;
  }, [safely, writeInterim]);

  /** One pass: transcribe what has been said so far, and commit if it ended. */
  const readyRef = useRef(false);

  const tick = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || !listeningRef.current) return;
    // Keep capturing while the model downloads; just do not ask it to work yet.
    if (!readyRef.current) {
      safely(() => setElapsed(recorder.getDuration()));
      return;
    }

    const duration = recorder.getDuration();
    safely(() => setElapsed(duration));
    if (duration < MIN_UTTERANCE_SECONDS) return;

    const silent = recorder.isSilent();
    silenceSinceRef.current = silent ? (silenceSinceRef.current ?? Date.now()) : null;

    const quietLongEnough =
      silenceSinceRef.current !== null && Date.now() - silenceSinceRef.current >= SILENCE_COMMIT_MS;
    const tooLong = duration >= MAX_UTTERANCE_SECONDS;

    if (busyRef.current) return;

    busyRef.current = true;
    requestRef.current += 1;
    const audio = recorder.getAudio();
    send({ type: 'transcribe', id: requestRef.current, audio });

    if (quietLongEnough || tooLong) {
      // Wait for this pass to land, then close the utterance out.
      const id = requestRef.current;
      const settle = setInterval(() => {
        if (busyRef.current && requestRef.current === id) return;
        clearInterval(settle);
        commit();
        recorder.reset();
        silenceSinceRef.current = null;
        safely(() => setElapsed(0));
      }, 120);
    }
  }, [commit, safely, send]);

  const start = useCallback(() => {
    if (listeningRef.current) return;

    listeningRef.current = true;
    setListening(true);
    setError(null);
    setStatus('requesting');
    send({ type: 'load', model, device: 'gpu' in navigator ? 'webgpu' : 'wasm' });

    void startRecorder()
      .then((recorder) => {
        if (unmountedRef.current || !listeningRef.current) {
          recorder.stop();
          return;
        }
        recorderRef.current = recorder;
        utteranceStartRef.current = Date.now();
        safely(() => setStatus('listening'));
        timerRef.current = setInterval(() => void tick(), REFRESH_MS);
      })
      .catch((cause: unknown) => {
        listeningRef.current = false;
        safely(() => setListening(false));
        const denied = cause instanceof DOMException && cause.name === 'NotAllowedError';
        safely(() => {
          setStatus('error');
          setError({
            code: denied ? 'not-allowed' : 'audio-capture',
            message: denied
              ? 'Microphone access was blocked. Allow it for this site, then try again.'
              : `Could not open the microphone: ${
                  cause instanceof Error ? cause.message : String(cause)
                }`,
            terminal: true,
          });
        });
      });
  }, [model, safely, send, tick]);

  const stop = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    if (timerRef.current !== null) clearInterval(timerRef.current);
    timerRef.current = null;

    const recorder = recorderRef.current;
    setStatus('stopping');

    // Final pass over whatever is left, so the last words are not lost.
    if (readyRef.current && recorder && recorder.getDuration() >= MIN_UTTERANCE_SECONDS) {
      requestRef.current += 1;
      const id = requestRef.current;
      busyRef.current = true;
      send({ type: 'transcribe', id, audio: recorder.getAudio() });

      const settle = setInterval(() => {
        if (busyRef.current && requestRef.current === id) return;
        clearInterval(settle);
        commit();
        safely(() => setStatus('idle'));
      }, 120);
    } else {
      safely(() => setStatus('idle'));
    }

    recorder?.stop();
    recorderRef.current = null;
    setElapsed(0);
  }, [commit, safely, send]);

  const reset = useCallback(() => {
    setSegments([]);
    writeInterim('');
    setError(null);
  }, [writeInterim]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      listeningRef.current = false;
      if (timerRef.current !== null) clearInterval(timerRef.current);
      recorderRef.current?.stop();
      recorderRef.current = null;
      workerRef.current?.postMessage({ type: 'dispose' } satisfies WhisperRequest);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const finalTranscript = segments.map((s) => s.text).join(' ').trim();

  return {
    status,
    loadProgress,
    ready: device !== null,
    device,
    isListening: listening && status !== 'error',
    finalTranscript,
    interimTranscript,
    transcript: [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim(),
    segments,
    error,
    elapsed,
    start,
    stop,
    reset,
  };
}
