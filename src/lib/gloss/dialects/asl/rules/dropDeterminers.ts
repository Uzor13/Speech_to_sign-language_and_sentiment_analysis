import type { GlossRule, TranslationNote } from '../../../types';
import { drop } from './helpers';

export const dropDeterminers: GlossRule = {
  name: 'dropDeterminers',
  describe: 'ASL has no articles, so "a", "an" and "the" carry no sign.',
  apply(tokens, ctx) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t) => {
      if (t.dropped) return t;
      if (t.pos !== 'det' && !ctx.lexicon.determiners.has(t.lower)) return t;
      notes.push({
        rule: 'dropDeterminers',
        message: `"${t.surface}" dropped — ASL has no articles.`,
        tokenIndex: t.index,
      });
      return drop(t, 'dropDeterminers');
    });
    return { tokens: next, notes };
  },
};
