/// <reference lib="webworker" />
import { pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

import type { WhisperRequest, WhisperResponse } from '@/lib/speech/localTypes';

/**
 * Speech recognition on the user's own machine.
 *
 * This runs in a worker because Whisper inference blocks for hundreds of
 * milliseconds at a time; on the main thread it would freeze the sign player
 * mid-playback. The model is fetched once from Hugging Face and then served
 * from the browser cache, so only the first use needs the network.
 */

let transcriber: AutomaticSpeechRecognitionPipeline | null = null;
let loading: Promise<void> | null = null;

const post = (message: WhisperResponse) => self.postMessage(message);

async function load(model: string, device: 'webgpu' | 'wasm'): Promise<void> {
  if (transcriber) return;

  transcriber = (await pipeline('automatic-speech-recognition', model, {
    device,
    // Per-module precision, not a single dtype. A whole-model fp16 export of
    // Whisper fails to build an ONNX session at all ("Subgraph output (logits)
    // is an outer scope value"); fp32 encoder with a quantised decoder is the
    // combination that actually runs on WebGPU, and q8 throughout is what
    // keeps the WebAssembly path small enough to be usable.
    dtype:
      device === 'webgpu'
        ? { encoder_model: 'fp32', decoder_model_merged: 'q4' }
        : { encoder_model: 'q8', decoder_model_merged: 'q8' },
    progress_callback: (progress: unknown) => {
      const p = progress as { status?: string; file?: string; progress?: number };
      if (p.status === 'progress' && p.file) {
        post({ type: 'loading', file: p.file, progress: Math.round(p.progress ?? 0) });
      }
    },
  })) as AutomaticSpeechRecognitionPipeline;

  post({ type: 'ready', device, model });
}

self.addEventListener('message', (event: MessageEvent<WhisperRequest>) => {
  const message = event.data;

  void (async () => {
    try {
      switch (message.type) {
        case 'load': {
          loading ??= load(message.model, message.device).catch(async (error: unknown) => {
            // WebGPU can be present but fail to compile the shaders; wasm is
            // slower but works anywhere, so it is worth one retry.
            if (message.device === 'webgpu') {
              transcriber = null;
              post({
                type: 'error',
                message: `WebGPU failed (${
                  error instanceof Error ? error.message : String(error)
                }). Falling back to WebAssembly, which is slower.`,
                fatal: false,
              });
              await load(message.model, 'wasm');
              return;
            }
            throw error;
          });
          await loading;
          break;
        }

        case 'transcribe': {
          // The recorder starts before the model has finished downloading, so
          // a request arriving early is normal: wait for the load in flight
          // rather than treating it as an error.
          if (!transcriber && loading) await loading;
          if (!transcriber) {
            post({ type: 'result', id: message.id, text: '' });
            break;
          }
          const output = await transcriber(message.audio, {
            // Whisper hallucinates confident nonsense on silence or noise, and
            // falls into repetition loops ("I've got other currents, I've got
            // other currents, ..."). Greedy decoding plus an n-gram block is
            // what keeps both in check.
            do_sample: false,
            temperature: 0,
            no_repeat_ngram_size: 4,
            condition_on_prev_tokens: false,
            chunk_length_s: 30,
            stride_length_s: 5,
          });
          const text = Array.isArray(output)
            ? output.map((o) => o.text ?? '').join(' ')
            : (output.text ?? '');
          post({ type: 'result', id: message.id, text: text.trim() });
          break;
        }

        case 'dispose': {
          await transcriber?.dispose?.();
          transcriber = null;
          loading = null;
          break;
        }

        default:
          break;
      }
    } catch (error) {
      post({
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
        fatal: message.type === 'load',
      });
    }
  })();
});
