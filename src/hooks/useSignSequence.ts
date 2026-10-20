import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import type { SignSequence, SignStep } from '@/lib/signs/types';
import {
  initialPlayerState,
  signSequenceReducer,
  type PlayerAction,
  type PlayerState,
  type Speed,
} from './signSequenceReducer';

export interface UseSignSequenceOptions {
  autoPlay?: boolean;
  initialSpeed?: Speed;
}

export interface UseSignSequenceResult extends PlayerState {
  step: SignStep | undefined;
  length: number;
  isFailed: (id: string) => boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (index: number) => void;
  restart: () => void;
  setSpeed: (speed: number) => void;
  /** Called by the component when a video element fires `ended`. */
  notifyStepEnded: () => void;
  /** Called when a clip fails to load, so the timeline moves on. */
  notifyStepFailed: (id: string) => void;
}

/** Steps whose duration is driven by a timer rather than a media element. */
const isTimed = (step: SignStep | undefined) =>
  step?.kind === 'letter' || step?.kind === 'pause';

export function useSignSequence(
  sequence: SignSequence,
  options: UseSignSequenceOptions = {},
): UseSignSequenceResult {
  const { autoPlay = false, initialSpeed = 1 } = options;
  const length = sequence.steps.length;

  const [state, dispatch] = useReducer(
    (s: PlayerState, a: PlayerAction) => signSequenceReducer(s, a, length),
    initialSpeed,
    initialPlayerState,
  );

  const step = sequence.steps[state.index];

  // Reset whenever the timeline itself changes.
  const stepIds = useMemo(() => sequence.steps.map((s) => s.id).join('|'), [sequence.steps]);
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      if (autoPlay && length > 0) dispatch({ type: 'PLAY' });
      return;
    }
    dispatch({ type: 'SEQUENCE_CHANGED' });
    if (autoPlay && length > 0) dispatch({ type: 'PLAY' });
  }, [stepIds, autoPlay, length]);

  /**
   * Clock two: timed steps.
   *
   * Video steps advance on the element's own `ended` event; letters and pauses
   * advance here. Pausing has to freeze both, which is why the remaining time
   * is derived from `elapsedInStepMs` rather than restarting the step.
   */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimer();
    if (state.status !== 'playing' || !isTimed(step)) return;

    const remaining = Math.max(0, (step?.durationMs ?? 0) - state.elapsedInStepMs);
    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      dispatch({ type: 'STEP_ENDED' });
    }, remaining / state.speed);

    return clearTimer;
  }, [state.status, state.index, state.speed, state.elapsedInStepMs, step, clearTimer]);

  // Timers must not outlive the component.
  useEffect(() => clearTimer, [clearTimer]);

  const elapsedNow = useCallback(() => {
    if (!isTimed(step) || state.status !== 'playing') return state.elapsedInStepMs;
    const sinceStart = (Date.now() - startedAtRef.current) * state.speed;
    return Math.min(state.elapsedInStepMs + sinceStart, step?.durationMs ?? 0);
  }, [step, state.status, state.elapsedInStepMs, state.speed]);

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE', elapsedInStepMs: elapsedNow() });
  }, [elapsedNow]);

  const toggle = useCallback(() => {
    dispatch({ type: 'TOGGLE', elapsedInStepMs: elapsedNow() });
  }, [elapsedNow]);

  return {
    ...state,
    step,
    length,
    isFailed: useCallback((id: string) => state.failed.has(id), [state.failed]),
    play: useCallback(() => dispatch({ type: 'PLAY' }), []),
    pause,
    toggle,
    next: useCallback(() => dispatch({ type: 'NEXT' }), []),
    prev: useCallback(() => dispatch({ type: 'PREV' }), []),
    seek: useCallback((index: number) => dispatch({ type: 'SEEK', index }), []),
    restart: useCallback(() => dispatch({ type: 'RESTART' }), []),
    setSpeed: useCallback((speed: number) => dispatch({ type: 'SET_SPEED', speed }), []),
    notifyStepEnded: useCallback(() => dispatch({ type: 'STEP_ENDED' }), []),
    notifyStepFailed: useCallback((id: string) => dispatch({ type: 'STEP_FAILED', id }), []),
  };
}
