import { useState } from 'react';

import type { GlossResult } from '@/lib/gloss/types';

/**
 * Why the gloss looks the way it does.
 *
 * This is only possible because the grammar rules never delete tokens — they
 * mark them dropped and say which rule did it. For a project about sign
 * language, being able to show "the → dropped, ASL has no articles" is worth
 * more than a marginally better translation.
 */
export function RuleTrace({ gloss }: { gloss: GlossResult }) {
  const [open, setOpen] = useState(false);

  if (gloss.notes.length === 0) return null;

  return (
    <div className="rounded-lg bg-white ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-ink-soft hover:text-brand-600"
      >
        <span>
          Why this gloss?{' '}
          <span className="font-normal text-slate-400">
            {gloss.notes.length} {gloss.notes.length === 1 ? 'change' : 'changes'}
          </span>
        </span>
        <span aria-hidden="true" className={open ? 'rotate-180' : ''}>
          ⌄
        </span>
      </button>

      {open && (
        <ul className="space-y-1.5 border-t border-black/5 px-4 py-3 text-sm">
          {gloss.notes.map((note, i) => (
            <li key={`${note.rule}-${i}`} className="flex gap-2">
              <code className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                {note.rule}
              </code>
              <span className="text-ink-soft">{note.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
