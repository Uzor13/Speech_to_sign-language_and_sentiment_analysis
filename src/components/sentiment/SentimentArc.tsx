import { useId, useState } from 'react';

import type { ArcPoint } from '@/lib/sentiment/types';

const TONE: Record<ArcPoint['label'], { fill: string; text: string }> = {
  positive: { fill: 'var(--color-positive)', text: 'Positive' },
  negative: { fill: 'var(--color-negative)', text: 'Negative' },
  neutral: { fill: 'var(--color-neutral)', text: 'Neutral' },
};

/** Keep a near-zero score visible as a sliver rather than nothing at all. */
const MIN_HEIGHT_PERCENT = 1.5;

/**
 * How the feeling moves across an utterance, one signed bar per sentence.
 *
 * A single headline number flattens "I loved it but the ending was awful" to
 * neutral, which is exactly what the old sentiment card did. Polarity is a
 * diverging scale, so it gets two poles and a neutral midpoint — and because
 * colour alone is never sufficient, every bar also carries its label and score
 * in text, with the full table underneath.
 */
export function SentimentArc({ arc }: { arc: ArcPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();

  if (arc.length === 0) return null;

  const labelEvery = arc.length <= 8 ? 1 : Math.ceil(arc.length / 8);

  return (
    <figure className="m-0">
      <figcaption id={titleId} className="mb-3 text-sm font-medium text-ink">
        Sentiment across what you said
        <span className="ml-2 font-normal text-ink-soft">
          sentence by sentence, −1 to +1
        </span>
      </figcaption>

      <div className="relative h-44 w-full" role="group" aria-labelledby={titleId}>
        {/* Zero baseline — recessive, as chart chrome should be. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-px"
          style={{ background: 'var(--color-axis)' }}
        />

        <div className="flex h-full items-stretch gap-0.5">
          {arc.map((point) => {
            const tone = TONE[point.label];
            const magnitude = Math.max(
              Math.abs(point.compound) * 50,
              MIN_HEIGHT_PERCENT,
            );
            const positive = point.compound >= 0;
            const isActive = active === point.index;

            return (
              <div
                key={point.index}
                className="relative min-w-0 flex-1"
                tabIndex={0}
                onMouseEnter={() => setActive(point.index)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(point.index)}
                onBlur={() => setActive(null)}
                aria-label={`Sentence ${point.index + 1}: ${tone.text}, score ${point.compound.toFixed(2)}. ${point.text}`}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0"
                  style={{
                    height: `${magnitude}%`,
                    background: tone.fill,
                    opacity: isActive ? 1 : 0.88,
                    ...(positive
                      ? { bottom: '50%', borderRadius: '4px 4px 0 0' }
                      : { top: '50%', borderRadius: '0 0 4px 4px' }),
                  }}
                />

                {isActive && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-left text-xs text-white shadow-lg"
                  >
                    <p className="font-semibold">
                      {tone.text} · {point.compound.toFixed(2)}
                    </p>
                    <p className="mt-0.5 text-white/80">{point.text}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct labels, selectively: a number on every bar is noise. */}
      <div className="mt-2 flex gap-0.5">
        {arc.map((point) => (
          <div key={point.index} className="min-w-0 flex-1 text-center">
            {point.index % labelEvery === 0 && (
              <span className="text-xs text-ink-soft tabular-nums">
                {point.compound.toFixed(2)}
              </span>
            )}
          </div>
        ))}
      </div>
    </figure>
  );
}
