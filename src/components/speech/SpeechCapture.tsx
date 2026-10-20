import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTranscript } from '@/state/TranscriptContext';

import { MicButton } from './MicButton';
import { TranscriptView } from './TranscriptView';
import { TranscriptInput } from './TranscriptInput';
import { UnsupportedBanner } from './UnsupportedBanner';
import { PermissionHelp } from './PermissionHelp';

/**
 * Microphone plus live transcript, writing into the shared transcript so it
 * survives navigating between pages.
 *
 * Note the recogniser is created per mount and never shared through context —
 * two live recognisers must not share one instance.
 */
export function SpeechCapture({ lang = 'en-US' }: { lang?: string }) {
  const { setText, clear } = useTranscript();
  const speech = useSpeechRecognition({ lang });

  // Mirror the live transcript into shared state as it grows. In an effect,
  // not during render — updating another component mid-render is a React
  // error, not just a warning.
  const live = speech.transcript;
  useEffect(() => {
    if (live) setText(live, 'speech');
  }, [live, setText]);

  const reset = () => {
    speech.reset();
    clear();
  };

  return (
    <div className="flex flex-col gap-3">
      {!speech.isSupported && <UnsupportedBanner />}

      {speech.isSupported && (
        <div className="flex flex-wrap items-center gap-3">
          <MicButton
            listening={speech.isListening}
            onStart={speech.start}
            onStop={speech.stop}
          />
          <Button variant="ghost" onClick={reset} disabled={!speech.transcript}>
            Clear
          </Button>
          {speech.status === 'requesting' && (
            <span className="text-sm text-ink-soft">Waiting for the microphone…</span>
          )}
        </div>
      )}

      {speech.error && <PermissionHelp error={speech.error} />}

      <TranscriptView
        segments={speech.segments}
        interim={speech.interimTranscript}
        listening={speech.isListening}
      />

      {speech.isSupported ? (
        <p className="text-xs text-slate-400">
          Recognition runs through your browser. Chrome sends the audio to Google to transcribe
          it, so this needs an internet connection — nothing is sent anywhere by this app itself.
        </p>
      ) : (
        <TranscriptInput onSubmit={(value) => setText(value, 'typed')} />
      )}
    </div>
  );
}
