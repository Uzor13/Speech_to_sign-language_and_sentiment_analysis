import type { SignStep } from '@/lib/signs/types';

/**
 * What is on screen right now, announced to screen readers as it changes.
 * Replaces the old hardcoded "The sign language videos: Alphabet, Apple,
 * Daily, Drink…" paragraph.
 */
export function CaptionStrip({ step }: { step: SignStep | undefined }) {
  const text = (() => {
    if (!step) return '';
    if (step.kind === 'pause') return 'Pause between sentences';
    if (step.kind === 'letter') {
      return `${step.letter.toUpperCase()} — spelling "${step.caption}" (${step.position.index} of ${step.position.total})`;
    }
    return step.sourceWords.length > 0
      ? `${step.gloss} — from "${step.sourceWords.join(' ')}"`
      : step.gloss;
  })();

  const fingerspelled = step?.kind === 'letter';

  return (
    <p
      role="status"
      aria-live="polite"
      aria-label="Now signing"
      className="min-h-6 text-center text-sm text-ink-soft"
    >
      {text}
      {fingerspelled && <span className="ml-1 text-brand-600">(fingerspelled)</span>}
    </p>
  );
}
