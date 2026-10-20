import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Card({
  title,
  action,
  className = '',
  bodyClassName = '',
  children,
}: CardProps) {
  return (
    <section
      className={`rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-3">
          {typeof title === 'string' ? (
            <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          ) : (
            title
          )}
          {action}
        </header>
      )}
      <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
