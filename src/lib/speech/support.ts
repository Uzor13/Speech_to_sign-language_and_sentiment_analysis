import type { RecognitionError } from './types';

/**
 * The only unchecked cast in the codebase.
 *
 * `SpeechRecognition` is still prefixed in most browsers and is not reliably
 * present in TypeScript's DOM lib, so reaching the constructor needs one cast.
 * It is isolated here so nothing else has to.
 */
export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    ((w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined) ??
    null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

/**
 * Turn a recogniser error code into something a person can act on, and say
 * whether listening should stop for good.
 */
export function describeRecognitionError(code: string): RecognitionError {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        code,
        message:
          'Microphone access was blocked. Allow it for this site in your browser settings, then try again.',
        terminal: true,
      };
    case 'audio-capture':
      return {
        code,
        message: 'No microphone was found. Connect one and try again.',
        terminal: true,
      };
    case 'network':
      return {
        code,
        // Worth saying plainly: people reasonably assume a keyless app is offline.
        message:
          'Speech recognition needs an internet connection — Chrome sends the audio to Google to transcribe it.',
        terminal: true,
      };
    case 'no-speech':
      return { code, message: 'No speech was detected. Still listening…', terminal: false };
    case 'aborted':
      return { code, message: 'Listening was interrupted.', terminal: false };
    case 'language-not-supported':
      return {
        code,
        message: 'That language is not supported by this browser.',
        terminal: true,
      };
    default:
      return { code, message: `Speech recognition failed (${code}).`, terminal: false };
  }
}
