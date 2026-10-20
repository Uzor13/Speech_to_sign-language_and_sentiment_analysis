import { useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { useDictation } from '@/hooks/useDictation';
import { useTranscript } from '@/state/TranscriptContext';

import { MicButton } from './MicButton';
import { TranscriptView } from './TranscriptView';
import { TranscriptInput } from './TranscriptInput';
import { PermissionHelp } from './PermissionHelp';
import { EngineNotice } from './EngineNotice';
import { EngineToggle } from './EngineToggle';

/**
 * Microphone plus live transcript, writing into the shared transcript so it
 * survives navigating between pages.
 *
 * Which recogniser is used is decided by useDictation: the browser's own where
 * it works, Whisper running locally where it does not. Typing is always
 * offered regardless.
 */
export function SpeechCapture() {
  const { text, setText, clear } = useTranscript();
  const dictation = useDictation();

  // Mirror *finalised* speech into shared state. Only finals: mirroring the
  // interim rewrite too would re-run the sign and sentiment pipelines on every
  // partial word.
  const finals = dictation.segments.map((s) => s.text).join(' ').trim();
  useEffect(() => {
    if (finals) setText(finals, 'speech');
  }, [finals, setText]);

  const canListen = dictation.engine !== 'none';

  const reset = () => {
    dictation.reset();
    clear();
  };

  return (
    <div className="flex flex-col gap-3">
      <EngineNotice dictation={dictation} />

      {canListen && (
        <div className="flex flex-wrap items-center gap-3">
          <MicButton
            listening={dictation.isListening}
            disabled={dictation.loadProgress !== null}
            onStart={dictation.start}
            onStop={dictation.stop}
          />
          <Button variant="ghost" onClick={reset} disabled={!text && !dictation.transcript}>
            Clear
          </Button>
          {dictation.status === 'requesting' && dictation.loadProgress === null && (
            <span className="text-sm text-ink-soft">Waiting for the microphone…</span>
          )}
        </div>
      )}

      {canListen && <EngineToggle dictation={dictation} />}

      {dictation.error && <PermissionHelp error={dictation.error} />}

      <TranscriptView
        text={text}
        interim={dictation.interimTranscript}
        listening={dictation.isListening}
      />

      {/*
        Always offered, not just when the microphone is missing. Plenty of
        reasons to type on a page built around speech: a quiet room, a
        misheard word to correct, or simply trying it out.
      */}
      <TranscriptInput
        onSubmit={(value) => setText(value, 'typed')}
        label={canListen ? 'Or type it instead' : 'Type instead'}
      />

      {dictation.engine === 'browser' && (
        <p className="text-xs text-slate-400">
          Recognition runs through your browser, not on your device:{' '}
          {dictation.support.browserName} sends the audio to{' '}
          {dictation.support.vendor === 'apple' ? 'Apple' : 'its speech service'} to transcribe
          it, so it needs a connection. This app itself sends nothing anywhere.
        </p>
      )}

      {dictation.engine === 'local' && dictation.device && (
        <p className="text-xs text-slate-400">
          Transcribing on your own machine with Whisper
          {dictation.device === 'webgpu' ? ' via WebGPU' : ' via WebAssembly'}. The audio never
          leaves this device.
        </p>
      )}
    </div>
  );
}
