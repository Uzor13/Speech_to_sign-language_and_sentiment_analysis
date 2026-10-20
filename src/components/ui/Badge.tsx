import type { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'positive' | 'negative' | 'muted';

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  positive: 'bg-teal-50 text-teal-800',
  negative: 'bg-rose-50 text-rose-800',
  muted: 'bg-slate-50 text-slate-500',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
