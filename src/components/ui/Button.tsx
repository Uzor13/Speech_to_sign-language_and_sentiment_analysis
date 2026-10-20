import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-200',
  secondary:
    'bg-white text-brand-600 ring-1 ring-brand-200 hover:bg-brand-50 disabled:text-brand-200',
  ghost: 'bg-transparent text-ink-soft hover:bg-brand-50 hover:text-brand-600',
  danger: 'bg-[#b4213c] text-white hover:bg-[#8f1930]',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
