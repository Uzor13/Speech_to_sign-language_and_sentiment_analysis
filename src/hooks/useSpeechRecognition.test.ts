import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useSpeechRecognition } from './useSpeechRecognition';
import { FakeSpeechRecognition } from '@/test/fixtures/fakeRecognition';

function setup(options = {}) {
  const recognition = new FakeSpeechRecognition();
  const view = renderHook(() =>
    useSpeechRecognition({ createRecognition: () => recognition, ...options }),
  );
  return { recognition, ...view };
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('useSpeechRecognition', () => {
  it('reports unsupported when there is no recogniser', () => {
    const { result } = renderHook(() =>
      useSpeechRecognition({ createRecognition: () => null }),
    );
    expect(result.current.isSupported).toBe(false);
    expect(result.current.status).toBe('unsupported');
  });

  it('replaces the interim transcript rather than appending to it', () => {
    // Appending is the classic bug: interim results are a running rewrite of
    // the same words, so appending produces "I I am I am going".
    const { recognition, result } = setup();
    act(() => result.current.start());

    act(() => recognition.emitInterim('I am'));
    expect(result.current.interimTranscript).toBe('I am');

    act(() => recognition.emitInterim('I am going'));
    expect(result.current.interimTranscript).toBe('I am going');
    expect(result.current.transcript).toBe('I am going');
  });

  it('accumulates finals without duplicating them across result indexes', () => {
    const { recognition, result } = setup();
    act(() => result.current.start());

    act(() => recognition.emitFinal('I am going'));
    act(() => recognition.emitFinal('to the store'));

    expect(result.current.segments.map((s) => s.text)).toEqual([
      'I am going',
      'to the store',
    ]);
    expect(result.current.finalTranscript).toBe('I am going to the store');
  });

  it('clears the interim text once a final arrives', () => {
    const { recognition, result } = setup();
    act(() => result.current.start());

    act(() => recognition.emitInterim('I am go'));
    act(() => recognition.emitFinal('I am going'));

    expect(result.current.interimTranscript).toBe('');
    expect(result.current.transcript).toBe('I am going');
  });

  it('reports each final segment through onFinal', () => {
    const onFinal = vi.fn();
    const { recognition, result } = setup({ onFinal });
    act(() => result.current.start());

    act(() => recognition.emitFinal('hello'));

    expect(onFinal).toHaveBeenCalledTimes(1);
    expect(onFinal.mock.calls[0]?.[0]).toMatchObject({ text: 'hello', isFinal: true });
  });

  it('restarts when the session ends on its own', () => {
    // Chrome ends a session after a few seconds of silence regardless of
    // `continuous`, so staying listening means restarting.
    const { recognition, result } = setup();
    act(() => result.current.start());
    expect(recognition.started).toBe(1);

    act(() => recognition.emitEnd());
    act(() => vi.advanceTimersByTime(300));

    expect(recognition.started).toBe(2);
  });

  it('does not restart after a permission error', () => {
    const { recognition, result } = setup();
    act(() => result.current.start());

    act(() => recognition.emitError('not-allowed'));
    act(() => recognition.emitEnd());
    act(() => vi.advanceTimersByTime(500));

    expect(recognition.started).toBe(1);
    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/microphone access was blocked/i);
  });

  it('treats no-speech as benign and keeps listening', () => {
    const { recognition, result } = setup();
    act(() => result.current.start());

    act(() => recognition.emitError('no-speech'));
    act(() => recognition.emitEnd());
    act(() => vi.advanceTimersByTime(300));

    expect(recognition.started).toBe(2);
    expect(result.current.error?.terminal).toBe(false);
  });

  it('gives up rather than spinning when the session keeps ending', () => {
    const { recognition, result } = setup();
    act(() => result.current.start());

    for (let i = 0; i < 10; i += 1) {
      act(() => recognition.emitEnd());
      act(() => vi.advanceTimersByTime(300));
    }

    expect(recognition.started).toBeLessThanOrEqual(7);
    expect(result.current.status).toBe('error');
    expect(result.current.error?.code).toBe('restart-budget');
  });

  it('explains a network error without claiming the user is offline', () => {
    // It means the browser could not reach a speech *service*, which is not
    // the same as having no connection.
    const { recognition, result } = setup();
    act(() => result.current.start());
    act(() => recognition.emitError('network'));

    expect(result.current.error?.message).toMatch(/could not reach/i);
    expect(result.current.error?.message).not.toMatch(/needs an internet connection/i);
  });

  it('stops listening without restarting when asked to stop', () => {
    const { recognition, result } = setup();
    act(() => result.current.start());
    act(() => result.current.stop());
    act(() => vi.advanceTimersByTime(500));

    expect(recognition.started).toBe(1);
  });

  it('aborts and detaches every handler on unmount', () => {
    // stop() can still deliver a final result after unmount; abort() cannot.
    const { recognition, result, unmount } = setup();
    act(() => result.current.start());

    unmount();

    expect(recognition.aborted).toBe(1);
    expect(recognition.onresult).toBeNull();
    expect(recognition.onend).toBeNull();
    expect(recognition.onerror).toBeNull();
  });

  it('does not restart after unmount', () => {
    const { recognition, result, unmount } = setup();
    act(() => result.current.start());
    act(() => recognition.emitEnd());
    unmount();
    act(() => vi.advanceTimersByTime(500));

    expect(recognition.started).toBe(1);
  });

  it('clears the transcript on reset', () => {
    const { recognition, result } = setup();
    act(() => result.current.start());
    act(() => recognition.emitFinal('hello'));
    act(() => result.current.reset());

    expect(result.current.segments).toEqual([]);
    expect(result.current.transcript).toBe('');
  });

  it('passes the configured language through to the recogniser', () => {
    const { recognition, result } = setup({ lang: 'en-GB' });
    act(() => result.current.start());
    expect(recognition.lang).toBe('en-GB');
  });
});
