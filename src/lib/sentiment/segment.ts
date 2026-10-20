import type { TranscriptSegment } from '../speech/types';

export interface Sentence {
  text: string;
  charStart: number;
  charEnd: number;
  asrSegmentId?: string;
  confidence?: number;
}

export interface SegmentOptions {
  /** Speech-recognition finals, used as sentence boundaries when present. */
  asrSegments?: TranscriptSegment[];
  /** Force a split in a long unpunctuated run after this many words. */
  maxWords?: number;
}

const DISCOURSE_MARKERS = [
  'but',
  'however',
  'although',
  'though',
  'because',
  'so',
  'and then',
  'then again',
  'whereas',
  'yet',
];

const hasTerminalPunctuation = (text: string) => /[.!?]/.test(text);

function withOffsets(parts: string[], source: string): Sentence[] {
  const sentences: Sentence[] = [];
  let cursor = 0;

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const start = source.indexOf(trimmed, cursor);
    if (start === -1) continue;
    cursor = start + trimmed.length;
    sentences.push({ text: trimmed, charStart: start, charEnd: cursor });
  }

  return sentences;
}

/** Split a long unpunctuated run on discourse markers, then on length. */
function splitRun(text: string, maxWords: number): string[] {
  const pattern = new RegExp(`\\s+(?=(?:${DISCOURSE_MARKERS.join('|')})\\b)`, 'i');
  const chunks = text.split(pattern);

  return chunks.flatMap((chunk) => {
    const words = chunk.trim().split(/\s+/);
    if (words.length <= maxWords) return [chunk];

    const out: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      out.push(words.slice(i, i + maxWords).join(' '));
    }
    return out;
  });
}

/**
 * Split an utterance into sentences.
 *
 * The interesting case is speech, which arrives with **no punctuation at
 * all**, so a regex on "." cannot be the only strategy. In order of
 * preference:
 *
 *   1. terminal punctuation, when the text has any (typed input)
 *   2. the recogniser's own finals — breath groups are a better sentence
 *      proxy than any heuristic
 *   3. discourse markers, with a hard cap on length
 */
export function segmentSentences(text: string, options: SegmentOptions = {}): Sentence[] {
  const { asrSegments, maxWords = 20 } = options;
  const source = text.trim();
  if (!source) return [];

  if (hasTerminalPunctuation(source)) {
    const parts = source.split(/(?<=[.!?])\s+/);
    return withOffsets(parts, source);
  }

  if (asrSegments && asrSegments.length > 0) {
    const sentences: Sentence[] = [];
    let cursor = 0;

    for (const segment of asrSegments) {
      const trimmed = segment.text.trim();
      if (!trimmed) continue;
      const start = source.indexOf(trimmed, cursor);
      if (start === -1) continue;
      cursor = start + trimmed.length;
      sentences.push({
        text: trimmed,
        charStart: start,
        charEnd: cursor,
        asrSegmentId: segment.id,
        confidence: segment.confidence,
      });
    }

    if (sentences.length > 0) return sentences;
  }

  return withOffsets(splitRun(source, maxWords), source);
}
