import { normalizeText } from './normalize';
import { splitClauses } from './segment';
import { tokenize } from './tokenize';
import { expandNumbers } from './numbers';
import { fingerspellWord } from './fingerspell';
import { heuristicTagger, type Tagger } from './tagger';
import { loadCompromiseTagger } from './tagger.compromise';
import type {
  Dialect,
  GlossClause,
  GlossResult,
  GlossToken,
  RuleContext,
  Token,
  TranslateOptions,
  TranslationNote,
} from './types';

const DEFAULTS: Required<TranslateOptions> = {
  topicComment: false,
  stripFillers: true,
};

function applyRules(
  tokens: Token[],
  dialect: Dialect,
  ctx: RuleContext,
): { tokens: Token[]; notes: TranslationNote[] } {
  let current = tokens;
  const notes: TranslationNote[] = [];

  for (const rule of dialect.rules) {
    const result = rule.apply(current, ctx);
    current = result.tokens;
    if (result.notes) notes.push(...result.notes);
  }

  return { tokens: current, notes };
}

/** Surviving tokens become glosses. Dropped ones are kept for the rule trace. */
function toGlossTokens(tokens: Token[], dialect: Dialect): GlossToken[] {
  const out: GlossToken[] = [];

  for (const token of tokens) {
    if (token.dropped) continue;

    if (token.preferFingerspell && token.pos !== 'marker') {
      const spelled = fingerspellWord(token.surface, dialect.alphabet, token.index);
      if (spelled.letters && spelled.letters.length > 0) out.push(spelled);
      continue;
    }

    const gloss = token.gloss ?? token.lemma.toUpperCase();
    if (!gloss) continue;

    out.push({
      id: `${token.index}-${gloss}`,
      gloss,
      kind:
        token.pos === 'marker'
          ? 'marker'
          : token.pos === 'num'
            ? 'number'
            : 'sign',
      source: token.synthetic ? [] : [token.surface],
      ...(token.numeric !== undefined ? { value: token.numeric } : {}),
    });
  }

  return out;
}

/**
 * English -> sign language gloss.
 *
 * Synchronous and pure, given a tagger. Every stage is a separate exported
 * function so the grammar can be tested without React, a DOM or a network.
 */
export function englishToGlossSync(
  text: string,
  dialect: Dialect,
  tagger: Tagger = heuristicTagger,
  options: TranslateOptions = {},
): GlossResult {
  const opts = { ...DEFAULTS, ...options };
  const normalized = normalizeText(text, { stripFillers: opts.stripFillers });

  if (!normalized) {
    return { source: text, clauses: [], glosses: [], notes: [] };
  }

  const clauses: GlossClause[] = [];
  const notes: TranslationNote[] = [];

  for (const clause of splitClauses(normalized, dialect.lexicon)) {
    const ctx: RuleContext = {
      lexicon: dialect.lexicon,
      isQuestion: clause.isQuestion,
      isWhQuestion: clause.isWhQuestion,
      options: opts,
    };

    const tagged = tagger.tag(tokenize(clause.text), dialect.lexicon, clause.text);
    const numbered = expandNumbers(tagged);
    const { tokens, notes: clauseNotes } = applyRules(numbered, dialect, ctx);

    clauses.push({
      source: clause.text,
      isQuestion: clause.isQuestion,
      isWhQuestion: clause.isWhQuestion,
      glosses: toGlossTokens(tokens, dialect),
      tokens,
    });
    notes.push(...clauseNotes);
  }

  // Flatten, separating clauses with a pause so the player does not run two
  // sentences together.
  const glosses: GlossToken[] = [];
  clauses.forEach((clause, i) => {
    if (i > 0 && clause.glosses.length > 0) {
      glosses.push({
        id: `pause-${i}`,
        gloss: dialect.lexicon.pauseGloss,
        kind: 'pause',
        source: [],
      });
    }
    glosses.push(...clause.glosses);
  });

  return { source: text, clauses, glosses, notes };
}

/**
 * The async entry point used by the UI: loads the compromise-backed tagger for
 * irregular verbs and name detection, falling back to heuristics if it fails.
 */
export async function englishToGloss(
  text: string,
  dialect: Dialect,
  options: TranslateOptions = {},
): Promise<GlossResult> {
  const tagger = await loadCompromiseTagger();
  return englishToGlossSync(text, dialect, tagger, options);
}

/** Render a gloss sequence the way it is written in ASL literature. */
export function glossToString(glosses: GlossToken[]): string {
  return glosses.map((g) => g.gloss).join(' ');
}
