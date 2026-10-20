# Adding a BSL dialect

The gloss engine is dialect-agnostic. Nothing outside this directory needs to
change to add British Sign Language — `translate.ts`, the sign registry, the
player and every page take the dialect as a parameter.

To add it, create `src/lib/gloss/dialects/bsl/index.ts` exporting a `Dialect`
(see `src/lib/gloss/types.ts`) and register it in `../index.ts`.

You need four things:

### 1. `lexicon.ts` — a `Lexicon`

Same shape as `../asl/lexicon.ts`. Most of it carries over, because the *input*
is English either way: determiners, the copula set, auxiliaries, irregular pasts
and plurals are English facts, not ASL ones. What genuinely differs:

- `pronouns` — BSL uses pointing (indexing) rather than distinct pronoun signs,
  so you may prefer `INDEX-1` / `INDEX-2` glosses over `ME` / `YOU`.
- `pastMarker` / `futureMarker` — BSL marks time with a timeline relative to the
  body rather than a `FINISH` completive. `BEFORE` / `WILL` are reasonable.
- `whQuestionMarker` — BSL question particles differ; non-manual features carry
  much of the load.

### 2. `alphabet.ts` — an `Alphabet` with `twoHanded: true`

**This is the big one.** BSL fingerspelling is two-handed: vowels are made by
touching the fingertips of the non-dominant hand, and most consonants involve
both hands. The `describe()` strings from `../asl/alphabet.ts` are wrong for BSL
and must be rewritten — do not copy them.

Letter assets go in `public/signs/letters/` and are selected by the manifest, so
a BSL build needs its own letter images listed there.

### 3. `rules/` — the grammar

Start by reusing the ASL rules that are really English-reduction rules and apply
to both (`dropDeterminers`, `dropAuxiliaries`, `dropCopula`, `lemmatizeVerbs`,
`plurals`, `possessives`). Then replace the ones that encode ASL word order:

- `questionOrder` — BSL also tends to put the wh-word last, but confirm before
  reusing.
- `topicComment` — BSL is more consistently topic-comment than ASL. You may want
  this on by default, unlike ASL where it ships off.
- `frontTimeWords` / `tenseMarkers` — rewrite for the BSL timeline.

### 4. Tests

Copy `src/lib/gloss/translate.test.ts` and replace the expectation table with
BSL glosses. **Have a BSL signer check the table before trusting it** — the
tests encode the grammar claims, so a wrong table bakes in a wrong grammar.
