import type { GlossToken } from '../gloss/types';

export interface SignEntry {
  /** Uppercase gloss this clip signs: 'FATHER', 'NUMBER-3'. */
  gloss: string;
  /** Path relative to the manifest's basePath. */
  file: string;
  /** English words that should also resolve to this clip. Lowercase. */
  aliases?: string[];
  durationMs?: number;
}

export interface LetterSet {
  dir: string;
  ext: string;
  /** Letters that actually have an image. Empty is fine — cards are drawn instead. */
  available: string[];
}

export interface SignManifestDefaults {
  clipMs: number;
  letterMs: number;
  pauseMs: number;
}

export interface SignManifest {
  version: number;
  basePath: string;
  dialect: string;
  defaults: SignManifestDefaults;
  letters: LetterSet;
  entries: SignEntry[];
}

export interface ManifestParseResult {
  ok: boolean;
  manifest: SignManifest;
  errors: string[];
}

export type ResolutionKind = 'clip' | 'fingerspell' | 'digits' | 'none';

export interface ResolvedSign {
  kind: ResolutionKind;
  /** Why this resolution won, for the coverage view. */
  via: 'gloss' | 'alias' | 'number' | 'prefer-fingerspell' | 'no-clip' | 'empty';
  entry?: SignEntry;
  src?: string;
  letters?: string[];
  digits?: string[];
}

export interface SignRegistry {
  manifest: SignManifest;
  resolve(token: GlossToken): ResolvedSign;
  has(gloss: string): boolean;
  letterSrc(letter: string): string | undefined;
  srcFor(entry: SignEntry): string;
  /** Every gloss the manifest can sign, sorted. For the sign library view. */
  glosses(): SignEntry[];
}

export type SignStep =
  | {
      kind: 'video';
      id: string;
      gloss: string;
      src: string;
      durationMs: number;
      caption: string;
      sourceWords: string[];
    }
  | {
      kind: 'letter';
      id: string;
      gloss: string;
      letter: string;
      /** Absent when no image exists — the card is drawn from the handshape text. */
      src?: string;
      durationMs: number;
      caption: string;
      sourceWords: string[];
      /** Position within the word being spelled, for "3 of 5". */
      position: { index: number; total: number };
    }
  | { kind: 'pause'; id: string; durationMs: number };

export interface SignSequence {
  steps: SignStep[];
  totalEstimatedMs: number;
  /** Glosses that produced nothing renderable at all. */
  unresolved: string[];
  clipCount: number;
  fingerspelledCount: number;
}

export interface CoverageReport {
  /** Glosses that needed rendering (markers and pauses excluded). */
  total: number;
  withClips: number;
  fingerspelled: number;
  /** 0–100, rounded. */
  percent: number;
  missing: string[];
}
