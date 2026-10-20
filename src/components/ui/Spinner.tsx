export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-ink-soft">
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500"
      />
      {label}
    </span>
  );
}
