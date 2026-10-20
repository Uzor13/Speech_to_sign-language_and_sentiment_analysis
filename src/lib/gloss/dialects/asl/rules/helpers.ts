import type { Token } from '../../../types';

export const live = (tokens: Token[]): Token[] => tokens.filter((t) => !t.dropped);

export function drop(token: Token, rule: string): Token {
  return { ...token, dropped: true, droppedBy: rule };
}

/** The first surviving token that acts as the clause's main verb. */
export function findMainVerb(tokens: Token[]): Token | undefined {
  return live(tokens).find((t) => t.pos === 'verb');
}

/** Move the matching tokens to the front, keeping their relative order. */
export function moveToFront(tokens: Token[], match: (t: Token) => boolean): Token[] {
  const moved = tokens.filter(match);
  if (moved.length === 0) return tokens;
  return [...moved, ...tokens.filter((t) => !match(t))];
}

/** Move the matching tokens to the end, keeping their relative order. */
export function moveToEnd(tokens: Token[], match: (t: Token) => boolean): Token[] {
  const moved = tokens.filter(match);
  if (moved.length === 0) return tokens;
  return [...tokens.filter((t) => !match(t)), ...moved];
}

export function marker(gloss: string, index: number): Token {
  return {
    surface: gloss,
    lower: gloss.toLowerCase(),
    index,
    pos: 'marker',
    lemma: gloss,
    gloss,
    synthetic: true,
  };
}
