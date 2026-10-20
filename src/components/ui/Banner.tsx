import type { ReactNode } from 'react';

type Tone = 'info' | 'warning' | 'error' | 'success';

const TONES: Record<Tone, { wrap: string; icon: string }> = {
  info: { wrap: 'bg-brand-50 text-brand-700 ring-brand-200', icon: 'ℹ' },
  warning: { wrap: 'bg-amber-50 text-amber-900 ring-amber-200', icon: '!' },
  error: { wrap: 'bg-rose-50 text-rose-900 ring-rose-200', icon: '✕' },
  success: { wrap: 'bg-teal-50 text-teal-900 ring-teal-200', icon: '✓' },
};

interface BannerProps {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

export function Banner({ tone = 'info', title, children, className = '' }: BannerProps) {
  const { wrap, icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-lg px-4 py-3 text-sm ring-1 ${wrap} ${className}`}
    >
      <span aria-hidden="true" className="select-none pt-px font-bold">
        {icon}
      </span>
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
    </div>
  );
}
