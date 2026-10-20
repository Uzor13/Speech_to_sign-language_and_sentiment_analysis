import type { GlossToken } from '@/lib/gloss/types';

const KIND_STYLES: Record<GlossToken['kind'], string> = {
  sign: 'bg-brand-50 text-brand-700 ring-brand-200',
  number: 'bg-sky-50 text-sky-800 ring-sky-200',
  fingerspell: 'bg-amber-50 text-amber-900 ring-amber-200',
  // Markers are grammar carried on the face and body, not a sign to play.
  marker: 'bg-slate-100 text-slate-600 ring-slate-200 italic',
  pause: 'bg-transparent text-slate-400 ring-transparent',
};

const KIND_TITLES: Record<GlossToken['kind'], string> = {
  sign: 'A sign',
  number: 'A number',
  fingerspell: 'Spelled out letter by letter',
  marker: 'Grammar, shown on the face and body rather than with the hands',
  pause: 'Pause between sentences',
};

/** The gloss, written the way ASL is written down. */
export function GlossStrip({ glosses }: { glosses: GlossToken[] }) {
  if (glosses.length === 0) return null;

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium tracking-wide text-ink-soft uppercase">Gloss</p>
      <ol aria-label="Gloss" className="flex flex-wrap items-center gap-1.5">
        {glosses.map((token) => (
          <li key={token.id}>
            <span
              title={`${KIND_TITLES[token.kind]}${
                token.source.length > 0 ? ` — from "${token.source.join(' ')}"` : ''
              }`}
              className={`inline-block rounded px-2 py-1 font-mono text-sm ring-1 ${KIND_STYLES[token.kind]}`}
            >
              {token.kind === 'pause' ? '//' : token.gloss}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
