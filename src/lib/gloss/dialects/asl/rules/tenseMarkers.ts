import type { GlossRule } from '../../../types';
import { marker } from './helpers';

export const tenseMarkers: GlossRule = {
  name: 'tenseMarkers',
  describe:
    'ASL marks time with a separate sign rather than by inflecting the verb: past becomes FINISH, future WILL. A lexical time word (TOMORROW, YESTERDAY) already does the job, so the marker is skipped.',
  apply(tokens, ctx) {
    // Dropped tokens are still inspected — the tense of "was" or "did" survives
    // the word that carried it.
    const hasTimeWord = tokens.some((t) => !t.dropped && ctx.lexicon.timeWords.has(t.lower));
    if (hasTimeWord) return { tokens };

    const tense = tokens.find((t) => t.tense === 'past')
      ? 'past'
      : tokens.find((t) => t.tense === 'future')
        ? 'future'
        : undefined;

    if (!tense) return { tokens };

    const gloss = tense === 'past' ? ctx.lexicon.pastMarker : ctx.lexicon.futureMarker;
    const lastIndex = tokens.reduce((max, t) => Math.max(max, t.index), 0);

    return {
      tokens: [...tokens, marker(gloss, lastIndex + 1)],
      notes: [
        {
          rule: 'tenseMarkers',
          message: `${tense === 'past' ? 'Past' : 'Future'} tense added as the separate sign ${gloss}.`,
        },
      ],
    };
  },
};
