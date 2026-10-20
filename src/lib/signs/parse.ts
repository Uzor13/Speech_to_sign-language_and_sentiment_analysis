import type { ManifestParseResult, SignEntry, SignManifest } from './types';

export const EMPTY_MANIFEST: SignManifest = {
  version: 1,
  basePath: '/signs',
  dialect: 'asl',
  defaults: { clipMs: 1200, letterMs: 450, pauseMs: 300 },
  letters: { dir: 'letters', ext: 'png', available: [] },
  entries: [],
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback: string): string =>
  typeof v === 'string' && v.trim() ? v.trim() : fallback;

const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback;

/**
 * Validate a manifest loaded at runtime.
 *
 * Never throws, and never rejects the whole file over one bad entry: a broken
 * line is skipped with an error recorded, so a typo while adding a sign cannot
 * take the app down. The errors surface in the sign library view rather than
 * the console.
 */
export function parseManifest(input: unknown): ManifestParseResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return {
      ok: false,
      manifest: EMPTY_MANIFEST,
      errors: ['Manifest is not an object. Everything will be fingerspelled.'],
    };
  }

  const defaultsRaw = isRecord(input.defaults) ? input.defaults : {};
  const lettersRaw = isRecord(input.letters) ? input.letters : {};

  const availableRaw = Array.isArray(lettersRaw.available) ? lettersRaw.available : [];
  const available = availableRaw
    .filter((l): l is string => typeof l === 'string' && /^[a-z]$/i.test(l))
    .map((l) => l.toLowerCase());

  if (availableRaw.length !== available.length) {
    errors.push('letters.available: ignored entries that are not single letters.');
  }

  const entriesRaw = Array.isArray(input.entries) ? input.entries : [];
  if (!Array.isArray(input.entries) && input.entries !== undefined) {
    errors.push('entries: expected an array; ignoring it.');
  }

  const byGloss = new Map<string, SignEntry>();

  entriesRaw.forEach((raw, i) => {
    if (!isRecord(raw)) {
      errors.push(`entries[${i}]: not an object; skipped.`);
      return;
    }
    const gloss = typeof raw.gloss === 'string' ? raw.gloss.trim().toUpperCase() : '';
    const file = typeof raw.file === 'string' ? raw.file.trim() : '';

    if (!gloss) {
      errors.push(`entries[${i}]: missing "gloss"; skipped.`);
      return;
    }
    if (!file) {
      errors.push(`entries[${i}] (${gloss}): missing "file"; skipped.`);
      return;
    }
    if (byGloss.has(gloss)) {
      errors.push(`entries[${i}]: duplicate gloss ${gloss}; the later entry wins.`);
    }

    const aliases = Array.isArray(raw.aliases)
      ? raw.aliases
          .filter((a): a is string => typeof a === 'string' && a.trim().length > 0)
          .map((a) => a.trim().toLowerCase())
      : undefined;

    byGloss.set(gloss, {
      gloss,
      file,
      ...(aliases && aliases.length > 0 ? { aliases } : {}),
      ...(typeof raw.durationMs === 'number' && raw.durationMs > 0
        ? { durationMs: raw.durationMs }
        : {}),
    });
  });

  const manifest: SignManifest = {
    version: num(input.version, 1),
    basePath: str(input.basePath, EMPTY_MANIFEST.basePath).replace(/\/$/, ''),
    dialect: str(input.dialect, EMPTY_MANIFEST.dialect),
    defaults: {
      clipMs: num(defaultsRaw.clipMs, EMPTY_MANIFEST.defaults.clipMs),
      letterMs: num(defaultsRaw.letterMs, EMPTY_MANIFEST.defaults.letterMs),
      pauseMs: num(defaultsRaw.pauseMs, EMPTY_MANIFEST.defaults.pauseMs),
    },
    letters: {
      dir: str(lettersRaw.dir, EMPTY_MANIFEST.letters.dir).replace(/^\/|\/$/g, ''),
      ext: str(lettersRaw.ext, EMPTY_MANIFEST.letters.ext).replace(/^\./, ''),
      available,
    },
    entries: [...byGloss.values()],
  };

  return { ok: errors.length === 0, manifest, errors };
}
