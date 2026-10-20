import type { Lexicon } from './types';

export interface Clause {
  text: string;
  isQuestion: boolean;
  isWhQuestion: boolean;
}

const FIRST_WORD = /[A-Za-z']+/;

/**
 * Split text into clauses and work out which are questions.
 *
 * Speech recognition emits no punctuation at all, so a trailing "?" cannot be
 * the only signal: a clause opening with a wh-word or an auxiliary is treated
 * as a question too. That is what makes "where are you going" work without the
 * user typing anything.
 */
export function splitClauses(text: string, lexicon: Lexicon): Clause[] {
  if (!text.trim()) return [];

  const pieces = text
    .split(/(?<=[.!?])\s+|(?<=[.!?])$/)
    .map((p) => p.trim())
    .filter(Boolean);

  const parts = pieces.length > 0 ? pieces : [text.trim()];

  return parts.map((part) => {
    const explicit = part.endsWith('?');
    const first = part.match(FIRST_WORD)?.[0]?.toLowerCase() ?? '';

    const isWh = lexicon.whWords.has(first);
    const opensWithAux = lexicon.auxiliaries.has(first) || lexicon.copula.has(first);

    return {
      text: part.replace(/[.!?]+$/, '').trim(),
      isQuestion: explicit || isWh || opensWithAux,
      isWhQuestion: isWh,
    };
  });
}
