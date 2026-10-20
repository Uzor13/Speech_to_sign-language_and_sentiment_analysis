import type { GlossRule } from '../../../types';
import { live, moveToFront } from './helpers';

/**
 * Topic-comment reordering, off by default.
 *
 * Fronting the object is genuinely ASL ("APPLE ME LIKE"), but the heuristic
 * only holds for clean pronoun-verb-object clauses. Outside those it produces
 * confident nonsense, and a wrong reordering is harder for a viewer to see
 * through than a conservative English-order gloss — so this ships as a toggle
 * and bails out whenever the shape is not exactly what it expects.
 */
export const topicComment: GlossRule = {
  name: 'topicComment',
  describe:
    'Moves the object to the front as the topic: "I like apples" becomes APPLE ME LIKE. Only applied to simple subject-verb-object clauses.',
  apply(tokens, ctx) {
    if (!ctx.options.topicComment || ctx.isQuestion) return { tokens };

    const surviving = live(tokens);
    if (surviving.length !== 3) return { tokens };

    const [subject, verb, object] = surviving;
    if (!subject || !verb || !object) return { tokens };
    if (subject.pos !== 'pronoun' || verb.pos !== 'verb') return { tokens };
    if (object.pos !== 'noun' && object.pos !== 'proper') return { tokens };

    return {
      tokens: moveToFront(tokens, (t) => t.index === object.index),
      notes: [
        {
          rule: 'topicComment',
          message: `${object.gloss ?? object.lemma.toUpperCase()} moved to the front as the topic.`,
        },
      ],
    };
  },
};
