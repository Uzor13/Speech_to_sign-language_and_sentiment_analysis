import type { Lexicon } from '../../types';

/** Articles carry no sign in ASL. */
const DETERMINERS = new Set(['a', 'an', 'the']);

/** ASL has no verb "to be". */
const COPULA = new Set(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);

/**
 * Grammatical auxiliaries, dropped only when they front an actual verb.
 * "She has 25 cats" keeps HAVE as a content verb; "She has eaten" drops it.
 */
const AUXILIARIES = new Set([
  'do', 'does', 'did',
  'have', 'has', 'had',
  'will', 'shall',
]);

/**
 * Modals are not grammatical filler — they have their own ASL signs, so they
 * are kept and glossed rather than dropped.
 */
const MODALS = new Map([
  ['can', 'CAN'],
  ['could', 'CAN'],
  ['may', 'MAYBE'],
  ['might', 'MAYBE'],
  ['must', 'MUST'],
  ['should', 'SHOULD'],
  ['would', 'WOULD'],
]);

const PRONOUNS = new Map([
  ['i', 'ME'],
  ['me', 'ME'],
  ['my', 'MY'],
  ['mine', 'MY'],
  ['myself', 'ME'],
  ['you', 'YOU'],
  ['your', 'YOUR'],
  ['yours', 'YOUR'],
  ['yourself', 'YOU'],
  ['he', 'HE'],
  ['him', 'HE'],
  ['his', 'HIS'],
  ['she', 'SHE'],
  ['her', 'HER'],
  ['hers', 'HER'],
  ['it', 'IT'],
  ['its', 'ITS'],
  ['we', 'WE'],
  ['us', 'WE'],
  ['our', 'OUR'],
  ['ours', 'OUR'],
  ['they', 'THEY'],
  ['them', 'THEY'],
  ['their', 'THEIR'],
  ['theirs', 'THEIR'],
  ['this', 'THIS'],
  ['that', 'THAT'],
  ['these', 'THESE'],
  ['those', 'THOSE'],
]);

/**
 * Lexical time words. These front the clause — ASL establishes time first,
 * then the event.
 */
const TIME_WORDS = new Map([
  ['yesterday', 'YESTERDAY'],
  ['today', 'TODAY'],
  ['tomorrow', 'TOMORROW'],
  ['tonight', 'TONIGHT'],
  ['now', 'NOW'],
  ['later', 'LATER'],
  ['soon', 'SOON'],
  ['already', 'ALREADY'],
  ['yet', 'YET'],
  ['always', 'ALWAYS'],
  ['never', 'NEVER'],
  ['sometimes', 'SOMETIMES'],
  ['often', 'OFTEN'],
  ['daily', 'DAILY'],
  ['weekly', 'WEEKLY'],
  ['monthly', 'MONTHLY'],
  ['yearly', 'YEARLY'],
  ['morning', 'MORNING'],
  ['afternoon', 'AFTERNOON'],
  ['evening', 'EVENING'],
  ['night', 'NIGHT'],
  ['week', 'WEEK'],
  ['month', 'MONTH'],
  ['year', 'YEAR'],
  ['monday', 'MONDAY'],
  ['tuesday', 'TUESDAY'],
  ['wednesday', 'WEDNESDAY'],
  ['thursday', 'THURSDAY'],
  ['friday', 'FRIDAY'],
  ['saturday', 'SATURDAY'],
  ['sunday', 'SUNDAY'],
]);

const WH_WORDS = new Map([
  ['who', 'WHO'],
  ['whom', 'WHO'],
  ['whose', 'WHOSE'],
  ['what', 'WHAT'],
  ['when', 'WHEN'],
  ['where', 'WHERE'],
  ['why', 'WHY'],
  ['which', 'WHICH'],
  ['how', 'HOW'],
]);

// 'never', 'none' and 'nothing' are excluded on purpose: each is its own ASL
// sign that behaves like an adverb, not a negator that relocates.
const NEGATORS = new Set(['not', "n't", 'no']);

const IRREGULAR_PAST = new Map([
  ['was', 'be'], ['were', 'be'], ['been', 'be'],
  ['went', 'go'], ['gone', 'go'],
  ['ate', 'eat'], ['eaten', 'eat'],
  ['drank', 'drink'], ['drunk', 'drink'],
  ['saw', 'see'], ['seen', 'see'],
  ['came', 'come'],
  ['did', 'do'], ['done', 'do'],
  ['made', 'make'],
  ['took', 'take'], ['taken', 'take'],
  ['gave', 'give'], ['given', 'give'],
  ['got', 'get'], ['gotten', 'get'],
  ['said', 'say'],
  ['told', 'tell'],
  ['knew', 'know'], ['known', 'know'],
  ['thought', 'think'],
  ['found', 'find'],
  ['felt', 'feel'],
  ['left', 'leave'],
  ['met', 'meet'],
  ['paid', 'pay'],
  ['put', 'put'],
  ['read', 'read'],
  ['ran', 'run'], ['run', 'run'],
  ['sat', 'sit'],
  ['slept', 'sleep'],
  ['spoke', 'speak'], ['spoken', 'speak'],
  ['stood', 'stand'],
  ['taught', 'teach'],
  ['wrote', 'write'], ['written', 'write'],
  ['bought', 'buy'],
  ['brought', 'bring'],
  ['caught', 'catch'],
  ['chose', 'choose'], ['chosen', 'choose'],
  ['drove', 'drive'], ['driven', 'drive'],
  ['fell', 'fall'], ['fallen', 'fall'],
  ['flew', 'fly'], ['flown', 'fly'],
  ['forgot', 'forget'], ['forgotten', 'forget'],
  ['heard', 'hear'],
  ['held', 'hold'],
  ['kept', 'keep'],
  ['lost', 'lose'],
  ['sent', 'send'],
  ['sold', 'sell'],
  ['understood', 'understand'],
  ['woke', 'wake'],
  ['won', 'win'],
  ['had', 'have'],
]);

/**
 * Present-tense irregulars. ASL verbs are uninflected, so "has" must reach the
 * gloss as HAVE, not HAS.
 */
const LEMMA_OVERRIDES = new Map([
  ['has', 'have'],
  ['have', 'have'],
  ['does', 'do'],
  ['do', 'do'],
  ['is', 'be'],
  ['am', 'be'],
  ['are', 'be'],
  ['goes', 'go'],
  ['says', 'say'],
]);

const IRREGULAR_PLURAL = new Map([
  ['children', 'child'],
  ['people', 'person'],
  ['men', 'man'],
  ['women', 'woman'],
  ['feet', 'foot'],
  ['teeth', 'tooth'],
  ['mice', 'mouse'],
  ['geese', 'goose'],
  ['lives', 'life'],
  ['knives', 'knife'],
  ['wives', 'wife'],
  ['leaves', 'leaf'],
  ['halves', 'half'],
]);

/**
 * Prepositions a directional verb absorbs. Spatial ones (in, on, under, with,
 * behind) do have signs and are kept.
 */
const DROPPABLE_PREPOSITIONS = new Set(['to', 'of', 'at', 'for']);

export const ASL_LEXICON: Lexicon = {
  determiners: DETERMINERS,
  copula: COPULA,
  auxiliaries: AUXILIARIES,
  modals: MODALS,
  pronouns: PRONOUNS,
  timeWords: TIME_WORDS,
  whWords: WH_WORDS,
  negators: NEGATORS,
  irregularPast: IRREGULAR_PAST,
  lemmaOverrides: LEMMA_OVERRIDES,
  irregularPlural: IRREGULAR_PLURAL,
  droppablePrepositions: DROPPABLE_PREPOSITIONS,
  pastMarker: 'FINISH',
  futureMarker: 'WILL',
  whQuestionMarker: 'WH-Q',
  ynQuestionMarker: 'Y/N-Q',
  negationGloss: 'NOT',
  pauseGloss: 'PAUSE',
};
