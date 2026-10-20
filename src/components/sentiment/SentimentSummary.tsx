import { Badge } from '@/components/ui/Badge';
import type { UtteranceSentiment } from '@/lib/sentiment/types';

const TONE_CLASS: Record<string, string> = {
  positive: 'text-[var(--color-positive)]',
  negative: 'text-[var(--color-negative)]',
  neutral: 'text-[var(--color-neutral)]',
};

/** Threshold above which the per-sentence scores disagree enough to say so. */
const MIXED_VOLATILITY = 0.35;

function ScoreBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-ink-soft">
        <span>{label}</span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.round(value * 100)}%`, background: tone }}
        />
      </div>
    </div>
  );
}

export function SentimentSummary({ sentiment }: { sentiment: UtteranceSentiment }) {
  const { documentLabel, documentScores, volatility, sentences, extremes } = sentiment;
  const mixed = volatility >= MIXED_VOLATILITY;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <p className={`font-display text-3xl font-semibold capitalize ${TONE_CLASS[documentLabel]}`}>
          {documentLabel}
        </p>
        <p className="text-sm text-ink-soft tabular-nums">
          overall score {documentScores.compound.toFixed(2)}
        </p>
        {mixed && <Badge tone="neutral">Mixed feelings</Badge>}
      </div>

      {mixed && (
        <p className="text-sm text-ink-soft">
          The sentences disagree with each other, so the single score above hides most of
          what happened. The arc shows it.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <ScoreBar label="Positive" value={documentScores.pos} tone="var(--color-positive)" />
        <ScoreBar label="Neutral" value={documentScores.neu} tone="var(--color-neutral)" />
        <ScoreBar label="Negative" value={documentScores.neg} tone="var(--color-negative)" />
      </div>

      {sentences.length > 1 && (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {extremes.mostPositive && (
            <div>
              <dt className="text-xs text-ink-soft">Most positive</dt>
              <dd className="text-ink">&ldquo;{extremes.mostPositive.text}&rdquo;</dd>
            </div>
          )}
          {extremes.mostNegative && (
            <div>
              <dt className="text-xs text-ink-soft">Most negative</dt>
              <dd className="text-ink">&ldquo;{extremes.mostNegative.text}&rdquo;</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
