import type { TokenContribution } from '@/lib/sentiment/types';

/**
 * Which words moved the score, measured by removing each one and seeing what
 * changes. Unlike reading a lexicon, this accounts for negation: in "not
 * good", `good` shows a negative contribution.
 */
export function TokenContributions({
  contributions,
  limit = 6,
}: {
  contributions: TokenContribution[];
  limit?: number;
}) {
  if (contributions.length === 0) return null;

  const shown = contributions.slice(0, limit);
  const max = Math.max(...shown.map((c) => Math.abs(c.delta)), 0.01);

  return (
    <div>
      <p className="mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">
        Words that moved the score
      </p>
      <ul className="flex flex-col gap-1.5">
        {shown.map((contribution) => {
          const positive = contribution.delta > 0;
          return (
            <li key={`${contribution.token}-${contribution.index}`} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-sm text-ink">
                {contribution.token}
              </span>
              <span className="relative h-2 flex-1 rounded-full bg-slate-100">
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    width: `${(Math.abs(contribution.delta) / max) * 50}%`,
                    background: positive ? 'var(--color-positive)' : 'var(--color-negative)',
                    ...(positive ? { left: '50%' } : { right: '50%' }),
                  }}
                />
              </span>
              <span className="w-14 shrink-0 text-right text-xs tabular-nums text-ink-soft">
                {contribution.delta > 0 ? '+' : ''}
                {contribution.delta.toFixed(2)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
