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
  const { text, setText, clear } = useTranscript();
  const speech = useSpeechRecognition({ lang });

  // Mirror *finalised* speech into shared state. Only finals: mirroring the
  // interim rewrite as well would re-run the whole sign and sentiment pipeline
  // on every partial word.
  const finals = speech.finalTranscript;
  useEffect(() => {
    if (finals) setText(finals, 'speech');
  }, [finals, setText]);

  const reset = () => {
    speech.reset();
    clear();
  };

  return (
    <div className="flex flex-col gap-3">
      {!speech.support.usable && <UnsupportedBanner support={speech.support} />}

      {speech.support.usable && (
        <div className="flex flex-wrap items-center gap-3">
          <MicButton listening={speech.isListening} onStart={speech.start} onStop={speech.stop} />
          <Button variant="ghost" onClick={reset} disabled={!text && !speech.transcript}>
            Clear
          </Button>
          {speech.status === 'requesting' && (
            <span className="text-sm text-ink-soft">Waiting for the microphone…</span>
          )}
        </div>
      )}

      {speech.error && <PermissionHelp error={speech.error} />}

      <TranscriptView
        text={text}
        interim={speech.interimTranscript}
        listening={speech.isListening}
      />

      {/*
        Always offered, not just when the microphone is missing. Plenty of
        reasons to type on a page built around speech: a quiet room, a
        misheard word to correct, or simply trying it out.
      */}
      <TranscriptInput
        onSubmit={(value) => setText(value, 'typed')}
        label={speech.support.usable ? 'Or type it instead' : 'Type instead'}
      />

      {speech.support.usable && (
        <p className="text-xs text-slate-400">
          Recognition runs through your browser, not on your device:{' '}
          {speech.support.browserName} sends the audio to{' '}
          {speech.support.vendor === 'apple' ? 'Apple' : 'its speech service'} to transcribe it,
          so it needs a connection. This app itself sends nothing anywhere.
        </p>
      )}
    </div>
  );
}
