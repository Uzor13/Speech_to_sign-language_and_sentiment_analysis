import type { GlossRule, TranslationNote } from '../../../types';

export const possessives: GlossRule = {
  name: 'possessives',
  describe:
    'Possession is shown by a flat hand toward the owner, not by an ending: "Peter’s book" is PETER BOOK.',
  apply(tokens) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t) => {
      if (t.dropped || t.gloss) return t;
      if (!/['’]s$/i.test(t.surface)) return t;
      const base = t.surface.replace(/['’]s$/i, '');
      notes.push({
        rule: 'possessives',
        message: `"${t.surface}" glossed as ${base.toUpperCase()} — ASL marks possession spatially.`,
        tokenIndex: t.index,
      });
      return { ...t, lemma: base.toLowerCase(), gloss: base.toUpperCase() };
    });
    return { tokens: next, notes };
  },
};
