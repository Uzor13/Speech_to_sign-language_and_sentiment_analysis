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
 * Smallest English model: about 40 MB, and the accuracy difference against
 * `base` is small for the short, clear utterances this app is built around.
 */
export const DEFAULT_WHISPER_MODEL = 'onnx-community/whisper-tiny.en';
