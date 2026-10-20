import type { GlossToken } from '../gloss/types';
import type { CoverageReport, SignRegistry } from './types';

const RENDERABLE = new Set(['sign', 'number', 'fingerspell']);

/**
 * How much of this utterance has a real clip rather than being spelled out.
 *
 * Surfaced as a badge in the UI so the gaps in the sign corpus are visible,
 * instead of users wondering why half a sentence is being spelled.
 */
export function coverageFor(glosses: GlossToken[], registry: SignRegistry): CoverageReport {
  const relevant = glosses.filter((g) => RENDERABLE.has(g.kind));

  let withClips = 0;
  let fingerspelled = 0;
  const missing: string[] = [];

  for (const token of relevant) {
    const resolved = registry.resolve(token);
    if (resolved.kind === 'clip' || resolved.kind === 'digits') {
      withClips += 1;
    } else {
      fingerspelled += 1;
      missing.push(token.gloss);
    }
  }

  const total = relevant.length;
  return {
    total,
    withClips,
    fingerspelled,
    percent: total === 0 ? 0 : Math.round((withClips / total) * 100),
    missing,
  };
}
