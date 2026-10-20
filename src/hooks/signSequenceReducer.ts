export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'ended';

export const SPEEDS = [0.5, 0.75, 1, 1.5] as const;
export type Speed = (typeof SPEEDS)[number];

export interface PlayerState {
  index: number;
  status: PlayerStatus;
  speed: Speed;
  /** Step ids whose media failed to load. */
  failed: ReadonlySet<string>;
  /**
   * How far into the current timed step we were when paused, so resuming
   * continues from there instead of restarting the letter.
   */
  elapsedInStepMs: number;
}

export type PlayerAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE'; elapsedInStepMs?: number }
  | { type: 'TOGGLE'; elapsedInStepMs?: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SEEK'; index: number }
  | { type: 'RESTART' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'STEP_ENDED' }
  | { type: 'STEP_FAILED'; id: string }
  | { type: 'SEQUENCE_CHANGED' };

export function initialPlayerState(speed: Speed = 1): PlayerState {
  return { index: 0, status: 'idle', speed, failed: new Set(), elapsedInStepMs: 0 };
}

const clampIndex = (index: number, length: number) =>
  length === 0 ? 0 : Math.min(Math.max(index, 0), length - 1);

const nearestSpeed = (value: number): Speed =>
  SPEEDS.reduce<Speed>(
    (best, s) => (Math.abs(s - value) < Math.abs(best - value) ? s : best),
    SPEEDS[2],
  );

/**
 * The player's whole state machine, as a pure function.
 *
 * It is a reducer rather than a pile of effects because the old implementation
 * drove playback from a `useEffect` that closed over a stale index and
 * re-attached its listener on every change — which is why it replayed the same
 * clip and could never resume after finishing. Here, `ended` only dispatches;
 * advancing is this function's job alone.
 */
export function signSequenceReducer(
  state: PlayerState,
  action: PlayerAction,
  length: number,
): PlayerState {
  switch (action.type) {
    case 'PLAY':
      if (length === 0) return state;
      // Playing from the end means starting over.
      if (state.status === 'ended') return { ...state, index: 0, status: 'playing', elapsedInStepMs: 0 };
      return { ...state, status: 'playing' };

    case 'PAUSE':
      if (state.status !== 'playing') return state;
      return {
        ...state,
        status: 'paused',
        elapsedInStepMs: action.elapsedInStepMs ?? state.elapsedInStepMs,
      };

    case 'TOGGLE':
      return state.status === 'playing'
        ? signSequenceReducer(
            state,
            { type: 'PAUSE', elapsedInStepMs: action.elapsedInStepMs },
            length,
          )
        : signSequenceReducer(state, { type: 'PLAY' }, length);

    case 'NEXT': {
      if (length === 0) return state;
      if (state.index >= length - 1) {
        return { ...state, index: length - 1, status: 'ended', elapsedInStepMs: 0 };
      }
      return { ...state, index: state.index + 1, elapsedInStepMs: 0 };
    }

    case 'PREV': {
      if (length === 0) return state;
      // From the end, step back onto the last step rather than off it.
      const from = state.status === 'ended' ? length : state.index;
      return {
        ...state,
        index: clampIndex(from - 1, length),
        status: state.status === 'ended' ? 'paused' : state.status,
        elapsedInStepMs: 0,
      };
    }

    case 'SEEK':
      if (length === 0) return state;
      return {
        ...state,
        index: clampIndex(action.index, length),
        status: state.status === 'ended' ? 'playing' : state.status,
        elapsedInStepMs: 0,
      };

    case 'RESTART':
      if (length === 0) return { ...state, index: 0, status: 'idle', elapsedInStepMs: 0 };
      return { ...state, index: 0, status: 'playing', elapsedInStepMs: 0 };

    case 'SET_SPEED':
      return { ...state, speed: nearestSpeed(action.speed) };

    case 'STEP_ENDED': {
      if (length === 0) return state;
      if (state.index >= length - 1) {
        return { ...state, index: length - 1, status: 'ended', elapsedInStepMs: 0 };
      }
      return { ...state, index: state.index + 1, elapsedInStepMs: 0 };
    }

    case 'STEP_FAILED': {
      // A clip that 404s marks itself and the timeline moves on. One bad file
      // must never stall the sequence.
      const failed = new Set(state.failed);
      failed.add(action.id);
      const advanced = signSequenceReducer({ ...state, failed }, { type: 'STEP_ENDED' }, length);
      return { ...advanced, failed };
    }

    case 'SEQUENCE_CHANGED':
      return { ...initialPlayerState(state.speed) };

    default:
      return state;
  }
}
