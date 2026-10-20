interface TranscriptViewProps {
  /** Finalised text, from speech or typing. */
  text: string;
  /** The recogniser's running rewrite of the current phrase. */
  interim: string;
  listening: boolean;
}

/**
 * Shows what has been captured so far. This is an output, not an input —
 * styled deliberately unlike the textarea beside it, because a bordered white
 * box reads as something you can click into and type in, and this is not.
 */
export function TranscriptView({ text, interim, listening }: TranscriptViewProps) {
  const empty = !text && !interim;

  return (
    <div>
      <p className="mb-1 text-xs font-medium tracking-wide text-ink-soft uppercase">
        Transcript
      </p>
      <output
        aria-live="polite"
        aria-label="Transcript"
        className="block min-h-24 rounded-lg border border-dashed border-black/10 bg-slate-50 px-4 py-3 text-lg leading-relaxed"
      >
        {empty ? (
          <span className="text-base text-slate-400">
            {listening ? 'Listening… say something.' : 'Speak or type, and your words appear here.'}
          </span>
        ) : (
          <span className="text-ink">
            {text}
            {interim && <span className="text-slate-400 italic"> {interim}</span>}
          </span>
        )}
      </output>
    </div>
  );
}
