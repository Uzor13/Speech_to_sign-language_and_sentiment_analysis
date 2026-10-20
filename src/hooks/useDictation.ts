import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSpeechRecognition } from './useSpeechRecognition';
import { useLocalDictation } from './useLocalDictation';
import { getSpeechSupport, type SpeechSupport } from '@/lib/speech/support';
import type { RecognitionError, RecognitionStatus, TranscriptSegment } from '@/lib/speech/types';

export type DictationEngine = 'browser' | 'local' | 'none';

export interface Dictation {
  engine: DictationEngine;
  support: SpeechSupport;
  status: RecognitionStatus;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  segments: TranscriptSegment[];
  error: RecognitionError | null;
  /** On-device only: 0–100 while the model downloads. */
  loadProgress: number | null;
  /** On-device only: which backend ended up being used. */
  device: 'webgpu' | 'wasm' | null;
  /** True when the local engine is available but not yet chosen. */
  canUseLocal: boolean;
  useLocalEngine: (use: boolean) => void;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

/** The on-device path needs a worker, WASM and a microphone. */
function localEngineAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof Worker !== 'undefined' &&
    typeof WebAssembly !== 'undefined' &&
    typeof AudioWorkletNode !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/**
 * Picks how to listen.
 *
 * The browser's own recogniser is the default where it works: it is instant,
 * streams word by word, and downloads nothing. Where it does not work — Brave
 * ships the API with no service, Firefox has no API at all — this falls back
 * to running Whisper on the user's own machine, which is slower to start but
 * works everywhere and sends the audio nowhere.
 */
export function useDictation(
  options: { onFinal?: (segment: TranscriptSegment) => void } = {},
): Dictation {
  const support = useMemo(() => getSpeechSupport(), []);
  const canUseLocal = useMemo(localEngineAvailable, []);

  // Fall back to on-device automatically where the browser cannot listen,
  // rather than leaving the user with a dead page.
  const [preferLocal, setPreferLocal] = useState(() => !support.usable && localEngineAvailable());

  const engine: DictationEngine = preferLocal
    ? 'local'
    : support.usable
      ? 'browser'
      : canUseLocal
        ? 'local'
        : 'none';

  const browser = useSpeechRecognition({ ...(options.onFinal ? { onFinal: options.onFinal } : {}) });
  const local = useLocalDictation({ ...(options.onFinal ? { onFinal: options.onFinal } : {}) });

  // If the browser engine dies at runtime (a fork with no service that we did
  // not detect up front), move to on-device rather than stranding the user.
  useEffect(() => {
    if (engine === 'browser' && browser.error?.code === 'network' && canUseLocal) {
      setPreferLocal(true);
    }
  }, [engine, browser.error, canUseLocal]);

  const active = engine === 'local' ? local : browser;

  const useLocalEngine = useCallback(
    (use: boolean) => {
      if (use && !canUseLocal) return;
      if (browser.isListening) browser.stop();
      if (local.isListening) local.stop();
      setPreferLocal(use);
    },
    [browser, local, canUseLocal],
  );

  return {
    engine,
    support,
    status: engine === 'none' ? 'unsupported' : active.status,
    isListening: active.isListening,
    transcript: active.transcript,
    interimTranscript: active.interimTranscript,
    segments: active.segments,
    error: active.error,
    loadProgress: engine === 'local' ? local.loadProgress : null,
    device: engine === 'local' ? local.device : null,
    canUseLocal,
    useLocalEngine,
    start: active.start,
    stop: active.stop,
    reset: active.reset,
  };
}
