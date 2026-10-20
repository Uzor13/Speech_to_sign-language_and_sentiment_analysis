import type { GlossRule } from '../../../types';
import { marker, moveToEnd } from './helpers';

export const questionOrder: GlossRule = {
  name: 'questionOrder',
  describe:
    'Question words go last in ASL ("YOU GO WHERE"), and the raised or furrowed brows that mark the question are written as WH-Q or Y/N-Q.',
  apply(tokens, ctx) {
    if (!ctx.isQuestion) return { tokens };

    const lastIndex = tokens.reduce((max, t) => Math.max(max, t.index), 0);

    if (ctx.isWhQuestion) {
      // Indices, not object identity — see placeNegation for why.
      const whIndices = new Set(
        tokens.filter((t) => !t.dropped && ctx.lexicon.whWords.has(t.lower)).map((t) => t.index),
      );
      const glossed = tokens.map((t) =>
        whIndices.has(t.index) ? { ...t, gloss: ctx.lexicon.whWords.get(t.lower) } : t,
      );
      return {
        tokens: [
          ...moveToEnd(glossed, (t) => whIndices.has(t.index)),
          marker(ctx.lexicon.whQuestionMarker, lastIndex + 2),
        ],
        notes: [
          {
            rule: 'questionOrder',
            message: `Question word moved to the end and marked ${ctx.lexicon.whQuestionMarker}.`,
          },
        ],
      };
    }

    return {
      tokens: [...tokens, marker(ctx.lexicon.ynQuestionMarker, lastIndex + 2)],
      notes: [
        {
          rule: 'questionOrder',
          message: `Marked ${ctx.lexicon.ynQuestionMarker} — a yes/no question is shown on the face, not by word order.`,
        },
      ],
    };
  },
};
