import type { GlossRule } from '../../../types';
import { findMainVerb } from './helpers';

export const placeNegation: GlossRule = {
  name: 'placeNegation',
  describe:
    'NOT sits immediately before the verb it negates ("ME NOT LIKE APPLE"). With no verb to negate — once the copula is gone — it falls to the end of the clause ("MY FATHER HERE NOT").',
  apply(tokens, ctx) {
    // Matched by token index, not object identity: adding the gloss below
    // creates new objects, so an identity check would silently match nothing.
    const negatedIndices = new Set(
      tokens.filter((t) => !t.dropped && ctx.lexicon.negators.has(t.lower)).map((t) => t.index),
    );
    if (negatedIndices.size === 0) return { tokens };

    const glossed = tokens.map((t) =>
      negatedIndices.has(t.index) ? { ...t, gloss: ctx.lexicon.negationGloss } : t,
    );

    const moved = glossed.filter((t) => negatedIndices.has(t.index));
    const rest = glossed.filter((t) => !negatedIndices.has(t.index));
    const verb = findMainVerb(rest);

    if (!verb) {
      return {
        tokens: [...rest, ...moved],
        notes: [
          {
            rule: 'placeNegation',
            message: 'NOT moved to the end of the clause — there is no verb to negate.',
          },
        ],
      };
    }

    const verbPos = rest.indexOf(verb);
    return {
      tokens: [...rest.slice(0, verbPos), ...moved, ...rest.slice(verbPos)],
      notes: [
        {
          rule: 'placeNegation',
          message: `NOT moved in front of ${verb.gloss ?? verb.lemma.toUpperCase()}.`,
        },
      ],
    };
  },
};
