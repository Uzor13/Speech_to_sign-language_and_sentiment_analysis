import type { GlossRule, TranslationNote } from '../../../types';
import { drop } from './helpers';

export const dropPrepositions: GlossRule = {
  name: 'dropPrepositions',
  describe:
    'Directional verbs absorb "to", "of", "at" and "for". Spatial prepositions (in, on, under, with) have signs and are kept.',
  apply(tokens, ctx) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t) => {
      if (t.dropped || !ctx.lexicon.droppablePrepositions.has(t.lower)) return t;
      notes.push({
        rule: 'dropPrepositions',
        message: `"${t.surface}" dropped — the verb's direction carries it.`,
        tokenIndex: t.index,
      });
      return drop(t, 'dropPrepositions');
    });
    return { tokens: next, notes };
  },
};
