import type { Alphabet, GlossToken } from '../gloss/types';
import { EMPTY_MANIFEST } from './parse';
import type { ResolvedSign, SignEntry, SignManifest, SignRegistry } from './types';

/**
 * Build the lookup that turns a gloss into something renderable.
 *
 * Pure and synchronous: the manifest is loaded once up front, so mapping
 * glosses to signs involves no async work. That is deliberate — the previous
 * implementation resolved each word with a separate `await` inside
 * `Promise.all(...).push(...)`, which made the order of the signs depend on
 * network timing. Sign order is now guaranteed by construction.
 */
export function createRegistry(manifest: SignManifest, alphabet: Alphabet): SignRegistry {
  const byGloss = new Map<string, SignEntry>();
  const byAlias = new Map<string, SignEntry>();

  for (const entry of manifest.entries) {
    byGloss.set(entry.gloss.toUpperCase(), entry);
    for (const alias of entry.aliases ?? []) byAlias.set(alias.toLowerCase(), entry);
  }

  const letters = new Set(manifest.letters.available);
  const spellable = new Set(alphabet.letters);

  const srcFor = (entry: SignEntry) =>
    `${manifest.basePath}/${entry.file.replace(/^\//, '')}`;

  const letterSrc = (letter: string): string | undefined => {
    const ch = letter.toLowerCase();
    if (!letters.has(ch)) return undefined;
    return `${manifest.basePath}/${manifest.letters.dir}/${ch}.${manifest.letters.ext}`;
  };

  const spell = (word: string): string[] =>
    word.toLowerCase().split('').filter((ch) => spellable.has(ch));

  function resolve(token: GlossToken): ResolvedSign {
    // 1. Names are always spelled, even if a clip happens to share the gloss.
    if (token.preferFingerspell) {
      const letters = token.letters ?? spell(token.source[0] ?? '');
      return letters.length > 0
        ? { kind: 'fingerspell', via: 'prefer-fingerspell', letters }
        : { kind: 'none', via: 'empty' };
    }

    // 2. Exact gloss.
    const exact = byGloss.get(token.gloss.toUpperCase());
    if (exact) return { kind: 'clip', via: 'gloss', entry: exact, src: srcFor(exact) };

    // 3. Alias, on any English word this gloss came from or the gloss itself.
    for (const word of [...token.source, token.gloss]) {
      const hit = byAlias.get(word.toLowerCase());
      if (hit) return { kind: 'clip', via: 'alias', entry: hit, src: srcFor(hit) };
    }

    // 4. A number with no clip of its own is signed digit by digit.
    if (token.kind === 'number' && token.value !== undefined) {
      const digits = String(token.value).split('').filter((d) => /\d/.test(d));
      const perDigit = digits.map((d) => byGloss.get(`NUMBER-${d}`));
      if (digits.length > 1 && perDigit.every(Boolean)) {
        return { kind: 'digits', via: 'number', digits };
      }
    }

    // 5. Fall back to spelling the original word. This is the floor: a word
    //    without a clip is spelled, never silently skipped.
    const spelled = token.letters ?? spell(token.source[0] ?? token.gloss);
    if (spelled.length > 0) return { kind: 'fingerspell', via: 'no-clip', letters: spelled };

    return { kind: 'none', via: 'empty' };
  }

  return {
    manifest,
    resolve,
    has: (gloss) => byGloss.has(gloss.toUpperCase()),
    letterSrc,
    srcFor,
    glosses: () => [...byGloss.values()].sort((a, b) => a.gloss.localeCompare(b.gloss)),
  };
}

/**
 * The registry you get with no assets at all: it spells everything. The app is
 * fully functional in this state, which is why the fallback path was built
 * first.
 */
export function createEmptyRegistry(alphabet: Alphabet): SignRegistry {
  return createRegistry(EMPTY_MANIFEST, alphabet);
}
