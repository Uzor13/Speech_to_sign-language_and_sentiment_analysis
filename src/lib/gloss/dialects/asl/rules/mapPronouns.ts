import type { GlossRule, TranslationNote } from '../../../types';

export const mapPronouns: GlossRule = {
  name: 'mapPronouns',
  describe: 'ASL pronouns are points, not words: "I" and "me" are both ME.',
  apply(tokens, ctx) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t) => {
      if (t.dropped || t.gloss) return t;
      const mapped = ctx.lexicon.pronouns.get(t.lower);
      if (!mapped) return t;
      if (mapped !== t.surface.toUpperCase()) {
        notes.push({
          rule: 'mapPronouns',
          message: `"${t.surface}" glossed as ${mapped}.`,
          tokenIndex: t.index,
        });
      }
      return { ...t, gloss: mapped };
    });
    return { tokens: next, notes };
  },
};
