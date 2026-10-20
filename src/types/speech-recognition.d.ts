/**
 * Web Speech API types.
 *
 * These interfaces are deliberately given unique "...Like" names rather than
 * declaring `SpeechRecognition` globally or augmenting `Window`. Depending on
 * the TypeScript version and `lib` setting, lib.dom.d.ts may already declare
 * those names, and redeclaring them is a duplicate-identifier error that shows
 * up only on some machines. Naming our own types sidesteps that entirely; the
 * single cast that bridges to the real constructor lives in
 * src/lib/speech/support.ts.
 */

interface SpeechRecognitionAlternativeLike {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  readonly length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
