import type { GlossRule, TranslationNote } from '../../../types';

export const lemmatizeVerbs: GlossRule = {
  name: 'lemmatizeVerbs',
  describe:
    'Verbs are not inflected in ASL: "running", "ran" and "runs" are all the sign RUN. Tense is carried separately.',
  apply(tokens) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t) => {
      if (t.dropped || t.pos !== 'verb' || t.gloss) return t;
      const gloss = t.lemma.toUpperCase();
      if (gloss !== t.surface.toUpperCase()) {
        notes.push({
          rule: 'lemmatizeVerbs',
          message: `"${t.surface}" glossed as ${gloss} — ASL verbs are uninflected.`,
          tokenIndex: t.index,
        });
      }
      return { ...t, gloss };
    });
    return { tokens: next, notes };
  },
};
