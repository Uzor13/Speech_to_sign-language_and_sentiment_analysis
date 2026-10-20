import { EMPTY_MANIFEST, parseManifest } from './parse';
import type { ManifestParseResult } from './types';

const MANIFEST_URL = '/signs/manifest.json';

let cached: Promise<ManifestParseResult> | null = null;

/**
 * Load the sign manifest once per page.
 *
 * The module-level cache *is* the sharing mechanism between routes — there is
 * no provider for this, because every consumer wants the same immutable result.
 *
 * A missing manifest is not an error: it resolves to EMPTY_MANIFEST, and the
 * whole app then fingerspells. That is a working state, not a broken one.
 */
export function loadManifest(url: string = MANIFEST_URL): Promise<ManifestParseResult> {
  cached ??= fetch(url, { headers: { Accept: 'application/json' } })
    .then(async (res) => {
      if (!res.ok) {
        return {
          ok: false,
          manifest: EMPTY_MANIFEST,
          errors: [
            `No sign manifest at ${url} (HTTP ${res.status}). Every word will be fingerspelled.`,
          ],
        } satisfies ManifestParseResult;
      }
      return parseManifest(await res.json());
    })
    .catch((error: unknown) => ({
      ok: false,
      manifest: EMPTY_MANIFEST,
      errors: [
        `Could not read ${url}: ${
          error instanceof Error ? error.message : String(error)
        }. Every word will be fingerspelled.`,
      ],
    }));

  return cached;
}

/** Tests only. */
export function __resetManifestCache(): void {
  cached = null;
}

export { EMPTY_MANIFEST };
