import type { GlossRule, TranslationNote } from '../../../types';

export const plurals: GlossRule = {
  name: 'plurals',
  describe:
    'Plurals are shown by repeating the sign or by a number, not by an -s: "apples" is APPLE.',
  apply(tokens) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t) => {
      if (t.dropped || t.gloss) return t;
      if (t.pos !== 'noun' || !t.plural) return t;
      const gloss = t.lemma.toUpperCase();
      notes.push({
        rule: 'plurals',
        message: `"${t.surface}" glossed as ${gloss} — ASL does not add a plural ending.`,
        tokenIndex: t.index,
      });
      return { ...t, gloss };
    });
    return { tokens: next, notes };
  },
};
