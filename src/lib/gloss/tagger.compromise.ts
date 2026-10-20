import type { Pos, Token } from './types';
import { heuristicTagger, type Tagger } from './tagger';

/**
 * The only module in the codebase that names `compromise`.
 *
 * Everything else talks to the `Tagger` interface, so swapping the NLP library
 * — or dropping back to pure heuristics — is a change to this file alone. The
 * previous implementation imported `natural`, a Node-only library, directly
 * into a React component; keeping the dependency behind a seam is how that
 * stops being possible.
 */

type CompromiseTerm = { text?: string; tags?: string[] };
type CompromiseFactory = (input: string) => {
  json: (opts?: unknown) => Array<{ terms?: CompromiseTerm[] }>;
};

/** compromise tag -> our coarse Pos, most specific first. */
const TAG_TO_POS: Array<[string, Pos]> = [
  ['ProperNoun', 'proper'],
  ['QuestionWord', 'wh'],
  ['Negative', 'neg'],
  ['Determiner', 'det'],
  ['Pronoun', 'pronoun'],
  ['Copula', 'aux'],
  ['Auxiliary', 'aux'],
  ['Modal', 'verb'],
  ['Value', 'num'],
  ['Cardinal', 'num'],
  ['Verb', 'verb'],
  ['Preposition', 'prep'],
  ['Conjunction', 'conj'],
  ['Adjective', 'adj'],
  ['Adverb', 'adv'],
  ['Noun', 'noun'],
];

function posFromTags(tags: string[]): Pos | undefined {
  for (const [tag, pos] of TAG_TO_POS) {
    if (tags.includes(tag)) return pos;
  }
  return undefined;
}

const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function createCompromiseTagger(nlp: CompromiseFactory): Tagger {
  return {
    id: 'compromise',
    tag(tokens, lexicon, clauseText) {
      // Start from the heuristic pass: it supplies lemmas, number values and
      // the closed-class decisions that come from the dialect's own lexicon,
      // which compromise knows nothing about.
      const base = heuristicTagger.tag(tokens, lexicon, clauseText);

      let terms: CompromiseTerm[];
      try {
        terms = nlp(clauseText)
          .json({ terms: { tags: true, text: true } })
          .flatMap((sentence) => sentence.terms ?? []);
      } catch {
        return base;
      }

      // Align by walking both lists. compromise may tokenize differently, so a
      // token that cannot be matched simply keeps its heuristic tag.
      let cursor = 0;
      return base.map((token) => {
        const wanted = normalise(token.surface);
        let matched: CompromiseTerm | undefined;

        for (let i = cursor; i < terms.length && i < cursor + 3; i += 1) {
          const term = terms[i];
          if (term?.text && normalise(term.text) === wanted) {
            matched = term;
            cursor = i + 1;
            break;
          }
        }

        if (!matched?.tags) return token;
        const tags = matched.tags;
        const pos = posFromTags(tags);
        const next: Token = { ...token };

        // Closed-class decisions stay with the lexicon — a dialect that glosses
        // "must" as MUST must not have it retagged to a bare auxiliary.
        const lexiconOwned =
          lexicon.determiners.has(token.lower) ||
          lexicon.pronouns.has(token.lower) ||
          lexicon.copula.has(token.lower) ||
          lexicon.auxiliaries.has(token.lower) ||
          lexicon.modals.has(token.lower) ||
          lexicon.negators.has(token.lower) ||
          lexicon.whWords.has(token.lower) ||
          lexicon.timeWords.has(token.lower);

        if (pos && !lexiconOwned) next.pos = pos;

        // This is the real reason compromise is here: irregular morphology and
        // name detection, which no suffix rule can fake.
        if (tags.includes('ProperNoun') && !lexiconOwned) {
          next.pos = 'proper';
          next.preferFingerspell = true;
        }
        if (tags.includes('PastTense')) next.tense = 'past';
        if (tags.includes('FutureTense')) next.tense = 'future';
        if (tags.includes('Plural') && next.pos === 'noun') next.plural = true;

        return next;
      });
    },
  };
}

let cached: Promise<Tagger> | null = null;

/**
 * Load the compromise-backed tagger, falling back to the heuristic one if the
 * dynamic import fails. Lazy so that routes with no sign rendering — home and
 * sentiment — never download it.
 */
export function loadCompromiseTagger(): Promise<Tagger> {
  cached ??= import('compromise')
    .then((mod) => {
      const nlp = (mod.default ?? mod) as unknown as CompromiseFactory;
      return createCompromiseTagger(nlp);
    })
    .catch(() => heuristicTagger);
  return cached;
}

/** Tests only. */
export function __resetTaggerCache(): void {
  cached = null;
}
