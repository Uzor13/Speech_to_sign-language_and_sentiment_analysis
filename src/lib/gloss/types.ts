/** Coarse part of speech. Enough for the gloss rules, no more. */
export type Pos =
  | 'noun'
  | 'proper'
  | 'verb'
  | 'adj'
  | 'adv'
  | 'pronoun'
  | 'det'
  | 'aux'
  | 'prep'
  | 'conj'
  | 'num'
  | 'wh'
  | 'neg'
  | 'marker'
  | 'other';

export type Tense = 'past' | 'present' | 'future';

/**
 * A word on its way to becoming a gloss.
 *
 * Rules never splice entries out of the token array — they set `dropped` and
 * `droppedBy`, and the final stage filters. That is what lets the UI explain
 * *why* a word vanished instead of just losing it.
 */
export interface Token {
  surface: string;
  lower: string;
  index: number;
  pos: Pos;
  lemma: string;
  tense?: Tense;
  plural?: boolean;
  numeric?: number;
  /** Set by a rule to override the gloss derived from the lemma. */
  gloss?: string;
  /** Proper nouns are always spelled, never signed. */
  preferFingerspell?: boolean;
  dropped?: boolean;
  droppedBy?: string;
  /** True for tokens a rule invented (tense and question markers). */
  synthetic?: boolean;
}

export type GlossKind = 'sign' | 'fingerspell' | 'number' | 'marker' | 'pause';

export interface GlossToken {
  /** Stable across re-translation of the same text: React keys and player step ids. */
  id: string;
  /** 'FATHER', 'NOT', 'NUMBER-25', 'fs:P-E-T-E-R'. */
  gloss: string;
  kind: GlossKind;
  /** The English word(s) this came from. Empty for synthetic markers. */
  source: string[];
  preferFingerspell?: boolean;
  /** Set when kind === 'fingerspell'. Lowercase, one entry per letter. */
  letters?: string[];
  /** Set when kind === 'number'. */
  value?: number;
}

export interface TranslationNote {
  rule: string;
  message: string;
  /** Index into the original token list, when the note is about one word. */
  tokenIndex?: number;
}

export interface GlossClause {
  source: string;
  isQuestion: boolean;
  isWhQuestion: boolean;
  glosses: GlossToken[];
  /** Every token, including dropped ones, for the rule-trace UI. */
  tokens: Token[];
}

export interface GlossResult {
  source: string;
  clauses: GlossClause[];
  /** All clauses flattened, with PAUSE markers between them. */
  glosses: GlossToken[];
  notes: TranslationNote[];
}

export interface TranslateOptions {
  /**
   * Front the object in clean pronoun-verb-object clauses (topic-comment).
   * Correct ASL, but the heuristic misfires on anything complex, so a wrong
   * reordering is harder to explain to a viewer than a conservative gloss.
   */
  topicComment?: boolean;
  /** Drop "um", "uh", "like" and friends before translating. */
  stripFillers?: boolean;
}

export interface RuleContext {
  lexicon: Lexicon;
  isQuestion: boolean;
  isWhQuestion: boolean;
  options: Required<TranslateOptions>;
}

export interface GlossRule {
  name: string;
  /** Short human explanation, shown in the rule trace. */
  describe: string;
  apply(tokens: Token[], ctx: RuleContext): { tokens: Token[]; notes?: TranslationNote[] };
}

/** Everything language-specific about a sign language's grammar and lexicon. */
export interface Lexicon {
  determiners: ReadonlySet<string>;
  copula: ReadonlySet<string>;
  auxiliaries: ReadonlySet<string>;
  /** Modals have their own signs: 'must' -> 'MUST'. Kept, not dropped. */
  modals: ReadonlyMap<string, string>;
  /** English pronoun -> gloss. 'i' -> 'ME'. */
  pronouns: ReadonlyMap<string, string>;
  /** Lexical time words, which front the clause. 'tomorrow' -> 'TOMORROW'. */
  timeWords: ReadonlyMap<string, string>;
  whWords: ReadonlyMap<string, string>;
  negators: ReadonlySet<string>;
  /** 'went' -> 'go'. */
  irregularPast: ReadonlyMap<string, string>;
  /** Present-tense irregulars: 'has' -> 'have'. */
  lemmaOverrides: ReadonlyMap<string, string>;
  /** 'children' -> 'child'. */
  irregularPlural: ReadonlyMap<string, string>;
  /** Prepositions a directional verb absorbs, so they carry no sign. */
  droppablePrepositions: ReadonlySet<string>;
  pastMarker: string;
  futureMarker: string;
  whQuestionMarker: string;
  ynQuestionMarker: string;
  negationGloss: string;
  pauseGloss: string;
}

export interface Alphabet {
  id: string;
  /** Lowercase letters this alphabet can spell. */
  letters: readonly string[];
  twoHanded: boolean;
  /** Handshape description, shown on the typographic card when no image exists. */
  describe(letter: string): string;
}

export interface Dialect {
  id: string;
  label: string;
  lexicon: Lexicon;
  alphabet: Alphabet;
  /** Applied in order. Order is part of the grammar, not an implementation detail. */
  rules: readonly GlossRule[];
}
