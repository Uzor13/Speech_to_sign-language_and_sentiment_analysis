import type { GlossRule } from '../../../types';
import { moveToFront } from './helpers';

export const frontTimeWords: GlossRule = {
  name: 'frontTimeWords',
  describe:
    'ASL establishes time first and the event second, so "I am going tomorrow" becomes TOMORROW ME GO.',
  apply(tokens, ctx) {
    // Indices, not object identity — see placeNegation for why.
    const timeIndices = new Set(
      tokens.filter((t) => !t.dropped && ctx.lexicon.timeWords.has(t.lower)).map((t) => t.index),
    );
    if (timeIndices.size === 0) return { tokens };

    const glossed = tokens.map((t) =>
      timeIndices.has(t.index) ? { ...t, gloss: ctx.lexicon.timeWords.get(t.lower) } : t,
    );

    return {
      tokens: moveToFront(glossed, (t) => timeIndices.has(t.index)),
      notes: [
        {
          rule: 'frontTimeWords',
          message: `${glossed
            .filter((t) => timeIndices.has(t.index))
            .map((t) => t.gloss)
            .join(', ')} moved to the front \u2014 ASL sets the time before the event.`,
        },
      ],
    };
  },
};
