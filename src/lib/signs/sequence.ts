import type { GlossToken } from '../gloss/types';
import type { SignRegistry, SignSequence, SignStep } from './types';

export interface BuildSequenceOptions {
  /** Overrides the manifest's letter timing. */
  letterMs?: number;
  pauseMs?: number;
}

/**
 * Turn a gloss sequence into one flat timeline of renderable steps.
 *
 * Video clips and generated fingerspell frames share a single timeline, so the
 * player advances through them uniformly — clips on their own `ended` event,
 * letters on a timer.
 */
export function buildSequence(
  glosses: GlossToken[],
  registry: SignRegistry,
  options: BuildSequenceOptions = {},
): SignSequence {
  const { defaults } = registry.manifest;
  const letterMs = options.letterMs ?? defaults.letterMs;
  const pauseMs = options.pauseMs ?? defaults.pauseMs;

  const steps: SignStep[] = [];
  const unresolved: string[] = [];
  let clipCount = 0;
  let fingerspelledCount = 0;

  const pushLetters = (token: GlossToken, letters: string[]) => {
    const word = token.source[0] ?? token.gloss.replace(/^fs:/, '').replace(/-/g, '');
    letters.forEach((letter, i) => {
      steps.push({
        kind: 'letter',
        id: `${token.id}-l${i}`,
        gloss: letter.toUpperCase(),
        letter,
        ...(registry.letterSrc(letter) ? { src: registry.letterSrc(letter) as string } : {}),
        durationMs: letterMs,
        caption: word,
        sourceWords: token.source,
        position: { index: i + 1, total: letters.length },
      });
    });
    fingerspelledCount += 1;
  };

  for (const token of glosses) {
    if (token.kind === 'pause') {
      steps.push({ kind: 'pause', id: token.id, durationMs: pauseMs });
      continue;
    }

    // Markers (WH-Q, FINISH, NOT) are grammar, carried on the face and body of
    // a signer. There is no clip to play, but they belong in the gloss strip,
    // so they are skipped here rather than reported as missing.
    if (token.kind === 'marker') continue;

    const resolved = registry.resolve(token);

    switch (resolved.kind) {
      case 'clip': {
        const entry = resolved.entry as NonNullable<typeof resolved.entry>;
        steps.push({
          kind: 'video',
          id: token.id,
          gloss: token.gloss,
          src: resolved.src as string,
          durationMs: entry.durationMs ?? defaults.clipMs,
          caption: token.gloss,
          sourceWords: token.source,
        });
        clipCount += 1;
        break;
      }

      case 'digits': {
        (resolved.digits ?? []).forEach((digit, i) => {
          const hit = registry.resolve({
            id: `${token.id}-d${i}`,
            gloss: `NUMBER-${digit}`,
            kind: 'number',
            source: [digit],
            value: Number(digit),
          });
          if (hit.kind === 'clip') {
            const entry = hit.entry as NonNullable<typeof hit.entry>;
            steps.push({
              kind: 'video',
              id: `${token.id}-d${i}`,
              gloss: `NUMBER-${digit}`,
              src: hit.src as string,
              durationMs: entry.durationMs ?? defaults.clipMs,
              caption: `${token.gloss} (${i + 1} of ${resolved.digits?.length})`,
              sourceWords: token.source,
            });
            clipCount += 1;
          }
        });
        break;
      }

      case 'fingerspell':
        pushLetters(token, resolved.letters ?? []);
        break;

      case 'none':
      default:
        unresolved.push(token.gloss);
        break;
    }
  }

  return {
    steps,
    totalEstimatedMs: steps.reduce((sum, s) => sum + s.durationMs, 0),
    unresolved,
    clipCount,
    fingerspelledCount,
  };
}

export const EMPTY_SEQUENCE: SignSequence = {
  steps: [],
  totalEstimatedMs: 0,
  unresolved: [],
  clipCount: 0,
  fingerspelledCount: 0,
};
