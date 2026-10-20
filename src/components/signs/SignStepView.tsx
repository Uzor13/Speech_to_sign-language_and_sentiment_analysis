import type { RefObject } from 'react';

import type { SignStep } from '@/lib/signs/types';
import { LetterFrame } from './LetterFrame';

interface SignStepViewProps {
  step: SignStep | undefined;
  videoRef: RefObject<HTMLVideoElement | null>;
  /** From the dialect alphabet, for the drawn letter card. */
  describeLetter: (letter: string) => string;
  failed: boolean;
  empty?: boolean;
}

/**
 * Shows the current step.
 *
 * The <video> element is **always mounted**, only hidden, because the previous
 * implementation unmounted it on the last step and so could never replay.
 */
export function SignStepView({
  step,
  videoRef,
  describeLetter,
  failed,
  empty,
}: SignStepViewProps) {
  const showVideo = step?.kind === 'video' && !failed;

  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-slate-900/5 ring-1 ring-black/5">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        aria-label={step?.kind === 'video' ? `Sign for ${step.gloss}` : undefined}
        className={`h-full w-full object-contain ${showVideo ? '' : 'invisible absolute'}`}
      />

      {step?.kind === 'letter' && (
        <LetterFrame
          letter={step.letter}
          {...(step.src ? { src: step.src } : {})}
          description={describeLetter(step.letter)}
          position={step.position}
          word={step.caption}
        />
      )}

      {step?.kind === 'pause' && (
        <p className="text-sm text-ink-soft" aria-hidden="true">
          …
        </p>
      )}

      {step?.kind === 'video' && failed && (
        <div className="p-6 text-center">
          <p className="font-display font-semibold text-ink">{step.gloss}</p>
          <p className="mt-1 text-sm text-ink-soft">
            This clip could not be loaded, so it was skipped.
          </p>
        </div>
      )}

      {empty && (
        <p className="p-6 text-center text-sm text-ink-soft">
          Nothing to sign yet. Say or type something to get started.
        </p>
      )}
    </div>
  );
}
