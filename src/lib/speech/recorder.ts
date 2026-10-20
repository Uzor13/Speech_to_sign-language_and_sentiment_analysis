import { WHISPER_SAMPLE_RATE } from './localTypes';

/**
 * An AudioWorklet that forwards raw samples to the page.
 *
 * Inlined as a blob rather than shipped as a file so the capture path has no
 * build-time coupling — and a worklet rather than the deprecated
 * ScriptProcessorNode, which runs on the main thread and drops samples
 * whenever the sign player is doing work.
 */
const WORKLET_SOURCE = `
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel && channel.length > 0) {
      this.port.postMessage(new Float32Array(channel));
    }
    return true;
  }
}
registerProcessor('recorder', RecorderProcessor);
`;

export interface Recorder {
  /** Everything captured since the last reset, as 16 kHz mono. */
  getAudio: () => Float32Array;
  /** Seconds of audio captured so far. */
  getDuration: () => number;
  /** True while the recent window is below the silence threshold. */
  isSilent: () => boolean;
  reset: () => void;
  stop: () => void;
}

export interface RecorderOptions {
  /** Called roughly every 100 ms with the running duration, for the UI. */
  onTick?: (seconds: number) => void;
}

/** Root-mean-square below this counts as silence. */
const SILENCE_RMS = 0.006;
/** How much trailing audio the silence test looks at. */
const SILENCE_WINDOW_SECONDS = 0.7;

function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (const sample of samples) sum += sample * sample;
  return Math.sqrt(sum / samples.length);
}

/**
 * Capture microphone audio as 16 kHz mono, which is what Whisper expects.
 *
 * The AudioContext is created at the target rate so the browser resamples in
 * native code; doing it in JavaScript would be both slower and worse.
 */
export async function startRecorder(options: RecorderOptions = {}): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const context = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE });
  const workletUrl = URL.createObjectURL(
    new Blob([WORKLET_SOURCE], { type: 'application/javascript' }),
  );

  try {
    await context.audioWorklet.addModule(workletUrl);
  } finally {
    URL.revokeObjectURL(workletUrl);
  }

  const source = context.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(context, 'recorder');

  let chunks: Float32Array[] = [];
  let length = 0;
  let lastTick = 0;

  node.port.onmessage = (event: MessageEvent<Float32Array>) => {
    chunks.push(event.data);
    length += event.data.length;

    const seconds = length / context.sampleRate;
    if (options.onTick && seconds - lastTick >= 0.1) {
      lastTick = seconds;
      options.onTick(seconds);
    }
  };

  source.connect(node);
  // Worklets only pull audio once connected to a destination. Routing through
  // a muted gain node keeps the graph alive without echoing the mic to the
  // speakers.
  const mute = context.createGain();
  mute.gain.value = 0;
  node.connect(mute);
  mute.connect(context.destination);

  const flatten = (from: number): Float32Array => {
    const out = new Float32Array(Math.max(0, length - from));
    let offset = 0;
    let seen = 0;
    for (const chunk of chunks) {
      const start = Math.max(0, from - seen);
      if (start < chunk.length) {
        out.set(chunk.subarray(start), offset);
        offset += chunk.length - start;
      }
      seen += chunk.length;
    }
    return out;
  };

  return {
    getAudio: () => flatten(0),
    getDuration: () => length / context.sampleRate,
    isSilent: () => {
      const window = Math.floor(SILENCE_WINDOW_SECONDS * context.sampleRate);
      if (length < window) return false;
      return rms(flatten(length - window)) < SILENCE_RMS;
    },
    reset: () => {
      chunks = [];
      length = 0;
      lastTick = 0;
    },
    stop: () => {
      node.port.onmessage = null;
      node.disconnect();
      source.disconnect();
      mute.disconnect();
      for (const track of stream.getTracks()) track.stop();
      void context.close();
    },
  };
}

export { rms, SILENCE_RMS };
