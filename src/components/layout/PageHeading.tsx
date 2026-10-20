import type { ReactNode } from 'react';

export function PageHeading({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
      {lead && <p className="mt-1 max-w-2xl text-ink-soft">{lead}</p>}
      {children}
    </div>
  );
}
