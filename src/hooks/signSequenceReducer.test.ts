import { describe, expect, it } from 'vitest';

import {
  initialPlayerState,
  signSequenceReducer as reduce,
  type PlayerState,
} from './signSequenceReducer';

const LENGTH = 3;
const at = (index: number, overrides: Partial<PlayerState> = {}): PlayerState => ({
  ...initialPlayerState(),
  index,
  status: 'playing',
  ...overrides,
});

describe('signSequenceReducer', () => {
  it('advances on STEP_ENDED', () => {
    expect(reduce(at(0), { type: 'STEP_ENDED' }, LENGTH)).toMatchObject({
      index: 1,
      status: 'playing',
    });
  });

  it('ends on the last step with the index clamped, not out of range', () => {
    const next = reduce(at(LENGTH - 1), { type: 'STEP_ENDED' }, LENGTH);
    expect(next).toMatchObject({ index: LENGTH - 1, status: 'ended' });
  });

  it('restarts from the end — the old player could not replay at all', () => {
    const ended = at(LENGTH - 1, { status: 'ended' });
    expect(reduce(ended, { type: 'RESTART' }, LENGTH)).toMatchObject({
      index: 0,
      status: 'playing',
    });
  });

  it('treats PLAY from the end as starting over', () => {
    const ended = at(LENGTH - 1, { status: 'ended' });
    expect(reduce(ended, { type: 'PLAY' }, LENGTH)).toMatchObject({ index: 0, status: 'playing' });
  });

  it('clamps SEEK in both directions', () => {
    expect(reduce(at(1), { type: 'SEEK', index: 99 }, LENGTH).index).toBe(LENGTH - 1);
    expect(reduce(at(1), { type: 'SEEK', index: -4 }, LENGTH).index).toBe(0);
  });

  it('stores elapsed time on PAUSE and keeps it for the resume', () => {
    const paused = reduce(at(1), { type: 'PAUSE', elapsedInStepMs: 180 }, LENGTH);
    expect(paused).toMatchObject({ status: 'paused', elapsedInStepMs: 180 });

    const resumed = reduce(paused, { type: 'PLAY' }, LENGTH);
    expect(resumed).toMatchObject({ status: 'playing', elapsedInStepMs: 180 });
  });

  it('clears elapsed time when moving to another step', () => {
    const paused = reduce(at(1), { type: 'PAUSE', elapsedInStepMs: 180 }, LENGTH);
    expect(reduce(paused, { type: 'NEXT' }, LENGTH).elapsedInStepMs).toBe(0);
    expect(reduce(paused, { type: 'SEEK', index: 0 }, LENGTH).elapsedInStepMs).toBe(0);
    expect(reduce(paused, { type: 'RESTART' }, LENGTH).elapsedInStepMs).toBe(0);
  });

  it('ignores PAUSE unless it is playing', () => {
    const idle = initialPlayerState();
    expect(reduce(idle, { type: 'PAUSE' }, LENGTH)).toBe(idle);
  });

  it('steps back onto the last step from the end, not off it', () => {
    const ended = at(LENGTH - 1, { status: 'ended' });
    expect(reduce(ended, { type: 'PREV' }, LENGTH)).toMatchObject({
      index: LENGTH - 1,
      status: 'paused',
    });
  });

  it('snaps SET_SPEED to an allowed value', () => {
    expect(reduce(at(0), { type: 'SET_SPEED', speed: 0.8 }, LENGTH).speed).toBe(0.75);
    expect(reduce(at(0), { type: 'SET_SPEED', speed: 99 }, LENGTH).speed).toBe(1.5);
  });

  it('records a failed step and advances past it rather than stalling', () => {
    const next = reduce(at(0), { type: 'STEP_FAILED', id: 'step-0' }, LENGTH);
    expect(next.index).toBe(1);
    expect([...next.failed]).toEqual(['step-0']);
  });

  it('ends cleanly if the final step is the one that fails', () => {
    const next = reduce(at(LENGTH - 1), { type: 'STEP_FAILED', id: 'last' }, LENGTH);
    expect(next).toMatchObject({ status: 'ended' });
    expect([...next.failed]).toEqual(['last']);
  });

  it('resets to idle when the sequence changes, keeping the chosen speed', () => {
    const playing = at(2, { speed: 1.5, failed: new Set(['x']) });
    expect(reduce(playing, { type: 'SEQUENCE_CHANGED' }, 5)).toMatchObject({
      index: 0,
      status: 'idle',
      speed: 1.5,
    });
  });

  it('does nothing on an empty sequence', () => {
    const idle = initialPlayerState();
    for (const action of [{ type: 'PLAY' }, { type: 'NEXT' }, { type: 'STEP_ENDED' }] as const) {
      expect(reduce(idle, action, 0)).toMatchObject({ index: 0 });
    }
  });
});
