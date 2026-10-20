import type { Lexicon, Pos, Token } from './types';

export interface Tagger {
  id: string;
  tag(tokens: Token[], lexicon: Lexicon, clauseText: string): Token[];
}

/**
 * Common English verbs. Suffix rules cannot recognise a bare infinitive
 * ("eat", "like", "go"), and getting the main verb wrong changes where
 * negation lands, so the heuristic tagger carries a short list.
 */
const VERB_HINTS = new Set([
  'go', 'come', 'see', 'look', 'watch', 'hear', 'listen', 'speak', 'talk', 'say', 'tell', 'ask',
  'eat', 'drink', 'sleep', 'wake', 'walk', 'run', 'sit', 'stand', 'live', 'work', 'play', 'read',
  'write', 'learn', 'teach', 'study', 'know', 'think', 'feel', 'want', 'need', 'like', 'love',
  'hate', 'help', 'give', 'take', 'make', 'buy', 'sell', 'pay', 'send', 'bring', 'get', 'put',
  'find', 'lose', 'keep', 'hold', 'open', 'close', 'start', 'stop', 'finish', 'try', 'use',
  'call', 'meet', 'visit', 'travel', 'drive', 'fly', 'wait', 'remember', 'forget', 'understand',
  'believe', 'hope', 'wish', 'choose', 'decide', 'win', 'lose', 'sign', 'drop', 'pick', 'search',
]);

/** Suffix-stripping lemmatiser. Good enough for regular forms. */
function lemmatise(word: string): string {
  if (word.length > 4 && word.endsWith('ing')) {
    const stem = word.slice(0, -3);
    // "running" -> "run": undo the doubled consonant.
    if (/([bdfglmnprt])\1$/.test(stem)) return stem.slice(0, -1);
    // "driving" -> "drive"
    if (/[^aeiou][aeiou][^aeiouwxy]$/.test(stem)) return `${stem}e`;
    return stem;
  }
  if (word.length > 3 && word.endsWith('ed')) {
    const stem = word.slice(0, -2);
    if (/([bdfglmnprt])\1$/.test(stem)) return stem.slice(0, -1);
    if (stem.endsWith('i')) return `${stem.slice(0, -1)}y`;
    return /[^aeiou][aeiou][^aeiouwxy]$/.test(stem) ? `${stem}e` : stem;
  }
  if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && (word.endsWith('ses') || word.endsWith('xes') || word.endsWith('ches') || word.endsWith('shes'))) {
    return word.slice(0, -2);
  }
  if (word.length > 2 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

const NUMBER_WORDS = new Map([
  ['zero', 0], ['one', 1], ['two', 2], ['three', 3], ['four', 4], ['five', 5],
  ['six', 6], ['seven', 7], ['eight', 8], ['nine', 9], ['ten', 10],
  ['eleven', 11], ['twelve', 12], ['thirteen', 13], ['fourteen', 14], ['fifteen', 15],
  ['sixteen', 16], ['seventeen', 17], ['eighteen', 18], ['nineteen', 19], ['twenty', 20],
  ['thirty', 30], ['forty', 40], ['fifty', 50], ['sixty', 60], ['seventy', 70],
  ['eighty', 80], ['ninety', 90], ['hundred', 100], ['thousand', 1000],
]);

function closedClass(token: Token, lexicon: Lexicon): Pos | undefined {
  const { lower } = token;
  if (lexicon.determiners.has(lower)) return 'det';
  if (lexicon.negators.has(lower)) return 'neg';
  if (lexicon.whWords.has(lower)) return 'wh';
  if (lexicon.pronouns.has(lower)) return 'pronoun';
  if (lexicon.copula.has(lower)) return 'aux';
  if (lexicon.auxiliaries.has(lower)) return 'aux';
  if (lexicon.modals.has(lower)) return 'verb';
  if (lexicon.droppablePrepositions.has(lower)) return 'prep';
  if (lexicon.timeWords.has(lower)) return 'adv';
  return undefined;
}

/**
 * Zero-dependency part-of-speech tagger.
 *
 * This is the fallback when the compromise import fails, and it is also what
 * every grammar rule test runs against — so the rule tests stay fast and are
 * unaffected by compromise's tagging changing between versions.
 */
export const heuristicTagger: Tagger = {
  id: 'heuristic',
  tag(tokens, lexicon) {
    const tagged = tokens.map((token): Token => {
      const { lower, surface } = token;

      const closed = closedClass(token, lexicon);
      if (closed) {
        const base: Token = { ...token, pos: closed };
        if (closed === 'verb') base.gloss = lexicon.modals.get(lower);
        if (lower === 'will' || lower === 'shall') base.tense = 'future';
        if (lexicon.irregularPast.has(lower)) {
          base.lemma = lexicon.irregularPast.get(lower) as string;
          base.tense = 'past';
        }
        if (lower === 'was' || lower === 'were' || lower === 'had' || lower === 'did') {
          base.tense = 'past';
        }
        const override = lexicon.lemmaOverrides.get(lower);
        if (override) base.lemma = override;
        return base;
      }

      if (/^\d/.test(lower)) {
        return { ...token, pos: 'num', numeric: Number.parseFloat(lower) };
      }
      if (NUMBER_WORDS.has(lower)) {
        return { ...token, pos: 'num', numeric: NUMBER_WORDS.get(lower) };
      }

      if (lexicon.irregularPast.has(lower)) {
        return {
          ...token,
          pos: 'verb',
          lemma: lexicon.irregularPast.get(lower) as string,
          tense: 'past',
        };
      }
      if (lexicon.irregularPlural.has(lower)) {
        return {
          ...token,
          pos: 'noun',
          lemma: lexicon.irregularPlural.get(lower) as string,
          plural: true,
        };
      }

      // Capitalised but not sentence-initial: a name, which gets spelled.
      if (token.index > 0 && /^[A-Z][a-z]/.test(surface)) {
        return { ...token, pos: 'proper', preferFingerspell: true };
      }

      if (lower.endsWith('ing') && lower.length > 4) {
        return { ...token, pos: 'verb', lemma: lemmatise(lower) };
      }
      if (lower.endsWith('ed') && lower.length > 3) {
        return { ...token, pos: 'verb', lemma: lemmatise(lower), tense: 'past' };
      }
      if (lower.endsWith('ly') && lower.length > 3) {
        return { ...token, pos: 'adv' };
      }
      if (VERB_HINTS.has(lower)) {
        return { ...token, pos: 'verb' };
      }
      if (lower.endsWith('s') && !lower.endsWith('ss') && lower.length > 2) {
        const lemma = lemmatise(lower);
        return VERB_HINTS.has(lemma)
          ? { ...token, pos: 'verb', lemma }
          : { ...token, pos: 'noun', lemma, plural: true };
      }

      return { ...token, pos: 'noun' };
    });

    return promoteVerbAfterAux(tagged, lexicon);
  },
};

/**
 * The first content word after an auxiliary is that auxiliary's verb, even when
 * no suffix gives it away: "do not *like*", "did you *eat*". Without this the
 * auxiliary looks like the only verb and negation lands in the wrong place.
 */
function promoteVerbAfterAux(tokens: Token[], lexicon: Lexicon): Token[] {
  const out = [...tokens];
  const skippable = new Set<Pos>(['neg', 'pronoun', 'adv']);

  out.forEach((token, i) => {
    const isAux = token.pos === 'aux' && !lexicon.copula.has(token.lower);
    if (!isAux) return;

    for (let j = i + 1; j < out.length; j += 1) {
      const candidate = out[j];
      if (!candidate) break;
      if (skippable.has(candidate.pos)) continue;
      if (candidate.pos === 'verb') break; // already fine
      if (candidate.pos === 'noun' || candidate.pos === 'other') {
        out[j] = { ...candidate, pos: 'verb', lemma: lemmatise(candidate.lower) };
      }
      break;
    }
  });

  return out;
}

export { lemmatise };
