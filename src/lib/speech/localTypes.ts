/** Messages the page sends into the Whisper worker. */
export type WhisperRequest =
  | { type: 'load'; model: string; device: 'webgpu' | 'wasm' }
  | { type: 'transcribe'; id: number; audio: Float32Array }
  | { type: 'dispose' };

/** Messages the worker sends back. */
export type WhisperResponse =
  | { type: 'loading'; file: string; progress: number }
  | { type: 'ready'; device: 'webgpu' | 'wasm'; model: string }
  | { type: 'result'; id: number; text: string }
  | { type: 'error'; message: string; fatal: boolean };

/** Whisper is trained on 16 kHz mono audio and expects exactly that. */
export const WHISPER_SAMPLE_RATE = 16_000;

/**
 * `base` rather than `tiny`: noticeably better on names and uncommon words,
 * which matters here because those are exactly the words that end up
 * fingerspelled rather than signed.
 */
export const DEFAULT_WHISPER_MODEL = 'onnx-community/whisper-base.en';

/**
 * Roughly how much the model weighs on each backend, for the download notice.
 *
 * Measured from the ONNX files this config actually fetches, not guessed — the
 * two paths differ by more than twice, so one number for both would be wrong
 * for somebody. WebGPU: fp16 encoder (41 MB) + q4 decoder (124 MB).
 * WebAssembly: int8 encoder (23 MB) + int8 decoder (54 MB).
 */
export const MODEL_DOWNLOAD_MB: Record<'webgpu' | 'wasm', number> = {
  webgpu: 165,
  wasm: 77,
};

/** Which backend this browser will use. */
export function preferredDevice(): 'webgpu' | 'wasm' {
  return typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm';
}
