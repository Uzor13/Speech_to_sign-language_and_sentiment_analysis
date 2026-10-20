import { useMemo, useState } from 'react';

import { PageHeading } from '@/components/layout/PageHeading';
import { Badge } from '@/components/ui/Badge';
import { Banner } from '@/components/ui/Banner';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { LetterFrame } from '@/components/signs/LetterFrame';
import { HandShapeSvg } from '@/components/signs/HandShapeSvg';
import { useSignManifest } from '@/hooks/useSignManifest';
import { getDialect } from '@/lib/gloss/dialects';

export default function SignLibraryPage() {
  const { registry, loading, errors } = useSignManifest();
  const [letter, setLetter] = useState<string | null>(null);

  const dialect = getDialect(registry.manifest.dialect);
  const entries = useMemo(() => registry.glosses(), [registry]);
  const letters = dialect.alphabet.letters;
  const withImages = registry.manifest.letters.available.length;

  return (
    <div>
      <PageHeading
        title="Sign Library"
        lead="Everything this app can sign, and what it spells out instead. Adding a clip takes one file and one line of JSON."
      />

      {loading && <Spinner label="Reading the sign manifest…" />}

      {!loading && errors.length > 0 && (
        <Banner tone="warning" title="Problems in the sign manifest" className="mb-4">
          <ul className="list-disc pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Sign clips"
          action={<Badge tone={entries.length > 0 ? 'brand' : 'muted'}>{entries.length}</Badge>}
        >
          {entries.length === 0 ? (
            <div className="text-sm text-ink-soft">
              <p>
                No clips yet, so every word is fingerspelled. That is a working state, not a
                broken one — the app spells anything you give it.
              </p>
              <p className="mt-3">To add one:</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>
                  Put a short, silent clip in <code className="text-xs">public/signs/clips/</code>
                </li>
                <li>
                  Add an entry to <code className="text-xs">public/signs/manifest.json</code>:
                </li>
              </ol>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
{`{ "gloss": "FATHER",
  "file": "clips/father.mp4",
  "aliases": ["dad", "papa"] }`}
              </pre>
              <p className="mt-2">
                Reload — no rebuild needed. Or run{' '}
                <code className="text-xs">npm run manifest</code> to generate the entries from
                whatever is in the folder.
              </p>
            </div>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {entries.map((entry) => (
                <li
                  key={entry.gloss}
                  className="flex items-center justify-between gap-2 rounded-lg bg-brand-50/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-brand-700">{entry.gloss}</p>
                    {entry.aliases && (
                      <p className="truncate text-xs text-ink-soft">
                        also: {entry.aliases.join(', ')}
                      </p>
                    )}
                  </div>
                  <video
                    muted
                    playsInline
                    preload="metadata"
                    src={registry.srcFor(entry)}
                    className="h-12 w-16 rounded object-cover"
                    onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Fingerspelling alphabet"
          action={
            <Badge tone={withImages > 0 ? 'brand' : 'muted'}>
              {withImages} of {letters.length} with images
            </Badge>
          }
        >
          <p className="mb-3 text-sm text-ink-soft">
            {dialect.label} uses a {dialect.alphabet.twoHanded ? 'two-handed' : 'one-handed'}{' '}
            alphabet. These are schematic diagrams drawn by the app, not photographs — enough to
            see the shape and tell the letters apart. Drop real images into{' '}
            <code className="text-xs">public/signs/letters/</code> and list them under{' '}
            <code className="text-xs">letters.available</code> to replace them. Pick a letter to
            see it larger.
          </p>

          <ul className="grid grid-cols-5 gap-2 sm:grid-cols-7">
            {letters.map((ch) => {
              const image = registry.letterSrc(ch);
              const selected = ch === letter;
              return (
                <li key={ch}>
                  <button
                    type="button"
                    onClick={() => setLetter(selected ? null : ch)}
                    aria-pressed={selected}
                    aria-label={`Letter ${ch.toUpperCase()}`}
                    className={`flex w-full flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                      selected
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-50 text-brand-500 hover:bg-brand-50'
                    }`}
                  >
                    {image ? (
                      <img src={image} alt="" className="h-10 w-auto" />
                    ) : (
                      <HandShapeSvg letter={ch} className="h-10 w-auto" />
                    )}
                    <span
                      className={`font-mono text-xs ${selected ? 'text-white' : 'text-ink-soft'}`}
                    >
                      {ch.toUpperCase()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {letter && (
            <div className="mt-4 rounded-lg bg-slate-50 ring-1 ring-black/5">
              <LetterFrame
                letter={letter}
                {...(registry.letterSrc(letter) ? { src: registry.letterSrc(letter) as string } : {})}
                description={dialect.alphabet.describe(letter)}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
