import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useDictation } from './useDictation';

/**
 * Engine selection only. Whisper itself cannot run in jsdom — there is no
 * WebGPU, no AudioWorklet and no microphone — so the model path is verified in
 * a real browser instead.
 */
function asEnvironment({
  brave = false,
  speechApi = true,
  worker = true,
  audioWorklet = true,
  media = true,
}) {
  vi.stubGlobal('SpeechRecognition', speechApi ? function () {} : undefined);
  vi.stubGlobal('webkitSpeechRecognition', undefined);
  vi.stubGlobal('Worker', worker ? class {} : undefined);
  vi.stubGlobal('AudioWorkletNode', audioWorklet ? class {} : undefined);

  const nav: Record<string, unknown> = {
    userAgent: 'Mozilla/5.0 Chrome/151.0.0.0 Safari/537.36',
    vendor: 'Google Inc.',
    ...(media ? { mediaDevices: { getUserMedia: () => Promise.resolve({}) } } : {}),
  };
  if (brave) nav.brave = { isBrave: async () => true };
  vi.stubGlobal('navigator', nav);
}

afterEach(() => vi.unstubAllGlobals());

describe('useDictation — engine selection', () => {
  it('uses the browser recogniser where it works', () => {
    asEnvironment({});
    expect(renderHook(() => useDictation()).result.current.engine).toBe('browser');
  });

  it('falls back to the on-device model in Brave', () => {
    // Brave ships the API with no service behind it, so the browser engine is
    // not an option no matter what feature detection says.
    asEnvironment({ brave: true });
    const { result } = renderHook(() => useDictation());

    expect(result.current.engine).toBe('local');
    expect(result.current.support.usable).toBe(false);
  });

  it('falls back to the on-device model in Firefox', () => {
    asEnvironment({ speechApi: false });
    expect(renderHook(() => useDictation()).result.current.engine).toBe('local');
  });

  it('reports no engine when neither path is available', () => {
    asEnvironment({ speechApi: false, worker: false });
    const { result } = renderHook(() => useDictation());

    expect(result.current.engine).toBe('none');
    expect(result.current.status).toBe('unsupported');
  });

  it('needs a microphone before offering the on-device model', () => {
    asEnvironment({ speechApi: false, media: false });
    expect(renderHook(() => useDictation()).result.current.canUseLocal).toBe(false);
  });

  it('needs AudioWorklet before offering the on-device model', () => {
    asEnvironment({ speechApi: false, audioWorklet: false });
    expect(renderHook(() => useDictation()).result.current.canUseLocal).toBe(false);
  });

  it('offers the choice only when both engines are available', () => {
    asEnvironment({});
    expect(renderHook(() => useDictation()).result.current.canUseLocal).toBe(true);

    asEnvironment({ worker: false });
    expect(renderHook(() => useDictation()).result.current.canUseLocal).toBe(false);
  });
});
