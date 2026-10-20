import type { GlossToken, Token } from './types';

/**
 * Numbers get their own glosses: NUMBER-25. The registry decides whether a
 * clip exists for that number or whether it has to be built digit by digit.
 */
export function numberToGloss(value: number, index: number): GlossToken {
  const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2));
  return {
    id: `${index}-number-${rounded}`,
    gloss: `NUMBER-${rounded}`,
    kind: 'number',
    source: [String(rounded)],
    value: rounded,
  };
}

/** Attach NUMBER-n glosses to numeric tokens. */
export function expandNumbers(tokens: Token[]): Token[] {
  return tokens.map((token) => {
    if (token.dropped || token.pos !== 'num' || token.gloss) return token;

    const value =
      token.numeric ??
      (Number.isNaN(Number.parseFloat(token.lower)) ? undefined : Number.parseFloat(token.lower));

    if (value === undefined || Number.isNaN(value)) return token;

    const rounded = Number.isInteger(value) ? value : Number(value.toFixed(2));
    return { ...token, numeric: rounded, gloss: `NUMBER-${rounded}` };
  });
}
