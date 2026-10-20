/** One finalised chunk of recognised speech. */
export interface TranscriptSegment {
  id: string;
  text: string;
  /** Recogniser confidence for the chosen alternative, 0–1. */
  confidence: number;
  isFinal: boolean;
  startedAt: number;
  endedAt: number;
}

export type RecognitionStatus =
  | 'unsupported'
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'stopping'
  | 'error';

export interface RecognitionError {
  code: string;
  message: string;
  /** Terminal errors must not trigger an auto-restart. */
  terminal: boolean;
}
