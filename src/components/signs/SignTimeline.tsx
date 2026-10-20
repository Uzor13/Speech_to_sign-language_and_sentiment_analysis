import { useEffect, useRef } from 'react';

import type { SignStep } from '@/lib/signs/types';

interface SignTimelineProps {
  steps: SignStep[];
  index: number;
  isFailed: (id: string) => boolean;
  onSeek: (index: number) => void;
}

const label = (step: SignStep) => {
  if (step.kind === 'pause') return '·';
  if (step.kind === 'letter') return step.letter.toUpperCase();
  return step.gloss;
};

/** Progress indicator and step control in one: every step is clickable. */
export function SignTimeline({ steps, index, isFailed, onSeek }: SignTimelineProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Guarded: scrolling the active chip into view is a nicety, and not every
    // environment implements it.
    activeRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [index]);

  if (steps.length === 0) return null;

  return (
    <ol className="flex flex-wrap justify-center gap-1" aria-label="Sign sequence">
      {steps.map((step, i) => {
        const current = i === index;
        const done = i < index;
        const failed = isFailed(step.id);

        return (
          <li key={step.id}>
            <button
              type="button"
              ref={current ? activeRef : undefined}
              onClick={() => onSeek(i)}
              aria-current={current ? 'step' : undefined}
              title={failed ? `${label(step)} — clip missing, skipped` : label(step)}
              className={`rounded px-2 py-0.5 font-mono text-xs transition-colors ${
                current
                  ? 'bg-brand-500 text-white'
                  : failed
                    ? 'bg-rose-50 text-rose-700 line-through hover:bg-rose-100'
                    : done
                      ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {label(step)}
              {step.kind === 'letter' && <span className="sr-only"> (fingerspelled)</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
