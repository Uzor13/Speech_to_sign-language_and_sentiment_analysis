import type { ReactNode } from 'react';

/**
 * A secondary view of the same utterance, below the page's main one.
 *
 * Every page works from one shared transcript, so whatever you said on any
 * page can be seen through any of the other lenses. These sections are how:
 * present but subordinate, and never competing with the page's main job.
 */
export function SecondarySection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-black/5 pt-6">
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {hint && <p className="text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
