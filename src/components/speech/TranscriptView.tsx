import type { TranscriptSegment } from '@/lib/speech/types';

interface TranscriptViewProps {
  segments: TranscriptSegment[];
  interim: string;
  listening: boolean;
}

/** Finals in solid text, the interim rewrite greyed out beside them. */
export function TranscriptView({ segments, interim, listening }: TranscriptViewProps) {
  const empty = segments.length === 0 && !interim;

  return (
    <div
      aria-live="polite"
      aria-label="Transcript"
      className="min-h-28 rounded-lg bg-white px-4 py-3 text-lg leading-relaxed ring-1 ring-black/5"
    >
      {empty ? (
        <p className="text-base text-slate-400">
          {listening ? 'Listening… say something.' : 'Your words will appear here.'}
        </p>
      ) : (
        <p className="text-ink">
          {segments.map((segment) => (
            <span key={segment.id}>{segment.text} </span>
          ))}
          {interim && <span className="text-slate-400 italic">{interim}</span>}
        </p>
      )}
    </div>
  );
}
