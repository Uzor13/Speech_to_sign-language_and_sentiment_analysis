import type { GlossRule } from '../../../types';

import { dropDeterminers } from './dropDeterminers';
import { dropPrepositions } from './dropPrepositions';
import { dropAuxiliaries } from './dropAuxiliaries';
import { dropCopula } from './dropCopula';
import { tenseMarkers } from './tenseMarkers';
import { lemmatizeVerbs } from './lemmatizeVerbs';
import { mapPronouns } from './mapPronouns';
import { possessives } from './possessives';
import { plurals } from './plurals';
import { placeNegation } from './placeNegation';
import { frontTimeWords } from './frontTimeWords';
import { questionOrder } from './questionOrder';
import { topicComment } from './topicComment';

/**
 * Order is grammar, not an implementation detail.
 *
 * The removals run first so later rules see only surviving words; tenseMarkers
 * runs after them because it reads tense off words the drops have already
 * marked (the past in "was" outlives the copula). Reordering comes last, so
 * negation is placed relative to the final verb position and the question
 * marker lands at the very end.
 */
export const ASL_RULES: readonly GlossRule[] = [
  dropDeterminers,
  dropPrepositions,
  dropAuxiliaries,
  dropCopula,
  tenseMarkers,
  lemmatizeVerbs,
  mapPronouns,
  possessives,
  plurals,
  placeNegation,
  frontTimeWords,
  questionOrder,
  topicComment,
];

export {
  dropDeterminers,
  dropPrepositions,
  dropAuxiliaries,
  dropCopula,
  tenseMarkers,
  lemmatizeVerbs,
  mapPronouns,
  possessives,
  plurals,
  placeNegation,
  frontTimeWords,
  questionOrder,
  topicComment,
};
