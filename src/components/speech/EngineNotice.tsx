import { Banner } from '@/components/ui/Banner';
import type { Dictation } from '@/hooks/useDictation';

/**
 * Explains which recogniser is in use and why — particularly when the browser
 * could not listen and the app has quietly switched to running the model
 * locally instead.
 */
export function EngineNotice({ dictation }: { dictation: Dictation }) {
  const { engine, support, loadProgress, device } = dictation;

  if (engine === 'none') {
    return (
      <Banner tone="warning" title={`${support.browserName} cannot listen`}>
        <p>
          {support.blockedReason ??
            'This browser has no speech recognition, and it cannot run the on-device model either.'}{' '}
          Type below instead — the signs and the sentiment work exactly the same way.
        </p>
      </Banner>
    );
  }

  if (engine === 'local' && loadProgress !== null) {
    return (
      <Banner tone="info" title="Downloading the speech model">
        <p>
          About 40&nbsp;MB, once. It is then cached by your browser, and
          transcription runs on your machine from then on — the audio never leaves it.
        </p>
        <div
          role="progressbar"
          aria-valuenow={loadProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Model download"
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100"
        >
          <div
            className="h-full rounded-full bg-brand-500 transition-[width]"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      </Banner>
    );
  }

  if (engine === 'local' && !support.usable) {
    return (
      <Banner tone="success" title="Listening on your device">
        <p>
          {support.browserName} cannot reach a speech service, so this is running Whisper
          locally{device ? ` on ${device === 'webgpu' ? 'your GPU' : 'WebAssembly'}` : ''}. The
          audio never leaves your machine. It starts a beat slower than a cloud recogniser and
          catches up in phrases rather than word by word.
        </p>
      </Banner>
    );
  }

  return null;
}
