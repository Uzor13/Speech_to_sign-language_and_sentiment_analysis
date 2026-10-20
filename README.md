# Speech to Sign Language and Sentiment Analysis

Speak or type English. The app transcribes it, translates it into sign language
gloss, plays the signs, and shows how the sentiment moves across what you said.

**It runs entirely in your browser.** No account, no backend, no API keys.

| Route | What it does |
|---|---|
| `/live` | Speak once — transcript, signs and sentiment arc fill in together |
| `/speech` | Speak, and see it signed |
| `/text` | Type instead. Works in every browser, with or without a microphone |
| `/sentiment` | Speak, and see the sentiment sentence by sentence |
| `/signs` | What the app can sign, what it spells, and how to add more |

```bash
npm install
npm run dev
```

Other scripts: `npm run test`, `npm run typecheck`, `npm run build`,
`npm run manifest`.

## Adding a sign clip

This is the thing you are most likely to want to do, so it takes one file and
one line of JSON — no rebuild and no code change.

1. Put a short, silent clip in `public/signs/clips/`, for example `father.mp4`.
2. Add an entry to `public/signs/manifest.json`:

```json
{
  "gloss": "FATHER",
  "file": "clips/father.mp4",
  "aliases": ["dad", "papa"],
  "durationMs": 1400
}
```

3. Reload. The manifest is read at runtime.

`gloss` is the uppercase sign name the translator produces; `aliases` are
English words that should also resolve to this clip. With more than a handful
of clips, `npm run manifest -- --write` generates the entries from whatever is
in the folder, preserving aliases you have already written.

Letter images are optional. Put `a.png` … `z.png` in `public/signs/letters/` and
list them under `letters.available`; they replace the drawn handshape cards
automatically.

**The app works with no assets at all.** With an empty manifest every word is
fingerspelled, and the handshape for each letter is *drawn* as an SVG diagram
(`src/components/signs/handshapes.ts` configures one parametric hand for all 26
letters). So it shows you the sign rather than only naming it, with nothing in
the repository. That is a working state, not a broken one — every clip you add
is an upgrade, never a prerequisite.

Those drawings are schematics, not photographs. They are good enough to see the
shape and tell most letters apart, but the closed-fist letters — A, E, M, N, S
and T — differ only in thumb position and are genuinely hard to distinguish at
small sizes. For teaching the alphabet properly, add real letter images; they
take precedence automatically.

## How it works

Everything under `src/lib/` is pure functions that know nothing about React,
the DOM, or the network. Hooks adapt them to React; components render. Anything
derivable from the transcript is a `useMemo`, never state.

**Speech** (`src/lib/speech`, `src/hooks/useSpeechRecognition.ts`) — the Web
Speech API, with live interim captions. Recognition is **not** done on your
device: the browser ships the audio to its own speech service, so `/speech`
needs a connection even though this app has no backend.

There are two engines, picked by `useDictation`:

| Browser | Engine |
|---|---|
| Chrome, Edge | Browser API — instant, streams word by word |
| Safari | Browser API, via Apple's servers |
| **Brave** | Ships the API with **no service behind it**, so: on-device |
| Firefox | No `SpeechRecognition` at all, so: on-device |

Brave is the trap that motivated `getSpeechSupport()`. It exposes
`webkitSpeechRecognition`, so naive feature detection says "supported", but
Brave removed the Google speech service the API depends on and every attempt
fails with a `network` error — which looks like "you are offline" to someone who
is not. Checking that the constructor exists is not enough.

**On-device recognition** (`src/workers/whisper.worker.ts`) is the fallback, and
is also selectable anywhere: `whisper-base.en` runs locally through
transformers.js, on WebGPU where available and WebAssembly otherwise. It is
fetched once from Hugging Face and then served from the browser cache; after
that the audio never leaves the machine.

The download differs by backend, so the UI states the one that applies rather
than a single number: **~165 MB on WebGPU** (fp16 encoder + q4 decoder) and
**~77 MB on WebAssembly** (int8 throughout). Note that a whole-model `fp16`
export will not build an ONNX session at all — "Subgraph output (logits) is an
outer scope value" — which is why the precision is set per module.

Whisper is not a streaming model, so live captions come from re-running it over
the growing utterance roughly every 1.5 s and replacing the interim text. A
stretch of silence, or a 10-second cap, commits the utterance and starts the
next — which is what keeps each pass fast. Expect phrases to land a beat behind
you rather than word by word, and expect lower accuracy than a cloud recogniser,
particularly on names.

Typing is always available on every page, in every browser.

**Translation** (`src/lib/gloss`) — normalize → split clauses → tokenize → tag →
expand numbers → apply ordered grammar rules → gloss. ASL is not word-for-word
English: articles and the copula are dropped, verbs are uninflected with tense
carried by a separate sign, negation moves relative to the verb, wh-words go
last, and names are fingerspelled.

```
I am going to the store tomorrow  ->  TOMORROW ME GO STORE
My father is not here             ->  MY FATHER HERE NOT
Where are you going?              ->  YOU GO WHERE WH-Q
She has 25 cats                   ->  SHE HAVE NUMBER-25 CAT
My name is Peter                  ->  MY NAME fs:P-E-T-E-R
```

That table lives in `src/lib/gloss/translate.test.ts` and is the acceptance
criteria for the grammar. Rules never delete words — they mark them dropped and
record which rule did it, which is what lets the UI explain *why* the gloss
looks the way it does.

The engine is dialect-agnostic. Everything language-specific — rule order, the
lexicon, the fingerspelling alphabet — sits behind the `Dialect` interface, with
ASL shipped. See `src/lib/gloss/dialects/bsl/README.md` for what adding British
Sign Language needs (chiefly: its alphabet is two-handed, so the handshape
descriptions cannot be reused).

**Signs** (`src/lib/signs`) — a gloss resolves through: names are always spelled
→ exact gloss → alias → whole-number clip → digit by digit → spell the word.
Pure and synchronous, so sign order is guaranteed rather than depending on
network timing. The last step is the floor: a word without a clip is spelled,
never silently skipped.

**Sentiment** (`src/lib/sentiment`) — VADER, client-side. VADER rather than a
plain AFINN sum because AFINN scores *"not good"* as positive: only "good" is in
its lexicon. VADER handles negation, intensifiers and but-contrast, which are
everywhere in speech. The result is a per-sentence arc, not one number — a
single score flattens *"I loved it but the ending was awful"* to neutral.

Speech recognition emits no punctuation at all, so sentence splitting falls back
to the recogniser's own finals (breath groups) and then to discourse markers.

## Stack

Vite · React 19 · TypeScript · Tailwind v4 · react-router 7 · Vitest ·
`compromise` (part-of-speech tagging) · `vader-sentiment` ·
`@huggingface/transformers` (on-device Whisper). All three load as lazy chunks —
and Whisper only inside a worker, spawned on demand — so routes that do not need
them never download them.

## History

This replaces an earlier version built on AWS Amplify (Cognito, Transcribe,
Comprehend, Polly, S3), Azure Text Analytics, and an unused Express/MongoDB
server. All three are gone, along with the credentials that were committed to
this repository — **those keys were exposed in git history and have been
rotated**. The current app needs no credentials at all, which is the point.
