import type { GlossRule, TranslationNote } from '../../../types';
import { drop } from './helpers';

export const dropCopula: GlossRule = {
  name: 'dropCopula',
  describe: 'ASL has no verb "to be". "The girl is tall" is simply GIRL TALL.',
  apply(tokens, ctx) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t) => {
      if (t.dropped || !ctx.lexicon.copula.has(t.lower)) return t;
      notes.push({
        rule: 'dropCopula',
        message: `"${t.surface}" dropped — ASL has no verb "to be".`,
        tokenIndex: t.index,
      });
      // Kept dropped rather than removed, so tenseMarkers can still read the
      // past tense off "was"/"were".
      return drop(t, 'dropCopula');
    });
    return { tokens: next, notes };
  },
};
