import type { GlossRule, Token, TranslationNote } from '../../../types';
import { drop } from './helpers';

/** Does a real verb follow this auxiliary? "has eaten" yes, "has 25 cats" no. */
function fronts(tokens: Token[], auxIndex: number): boolean {
  return tokens.slice(auxIndex + 1).some((t) => !t.dropped && t.pos === 'verb');
}

export const dropAuxiliaries: GlossRule = {
  name: 'dropAuxiliaries',
  describe:
    'A grammatical auxiliary disappears when it fronts a real verb. When it is the only verb it stays, as a content verb.',
  apply(tokens, ctx) {
    const notes: TranslationNote[] = [];
    const next = tokens.map((t, i) => {
      if (t.dropped) return t;
      if (t.pos !== 'aux' && !ctx.lexicon.auxiliaries.has(t.lower)) return t;

      // A clause-initial auxiliary in a question is the question marker itself
      // ("Did you eat…"). questionOrder adds Y/N-Q; it contributes no tense.
      const isQuestionAux = ctx.isQuestion && i === 0;

      if (isQuestionAux || fronts(tokens, i)) {
        notes.push({
          rule: 'dropAuxiliaries',
          message: isQuestionAux
            ? `"${t.surface}" dropped — the question itself is marked by Y/N-Q.`
            : `"${t.surface}" dropped — it only carries tense for "${
                tokens.slice(i + 1).find((x) => !x.dropped && x.pos === 'verb')?.surface ?? 'the verb'
              }".`,
          tokenIndex: t.index,
        });
        return isQuestionAux
          ? { ...drop(t, 'dropAuxiliaries'), tense: undefined }
          : drop(t, 'dropAuxiliaries');
      }

      // Kept: promote to a content verb so lemmatizeVerbs glosses it (HAVE, DO).
      return { ...t, pos: 'verb' as const };
    });
    return { tokens: next, notes };
  },
};
