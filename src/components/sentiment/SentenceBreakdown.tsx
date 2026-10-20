import type { SentenceSentiment } from '@/lib/sentiment/types';

const TONE_CLASS: Record<string, string> = {
  positive: 'text-[var(--color-positive)]',
  negative: 'text-[var(--color-negative)]',
  neutral: 'text-[var(--color-neutral)]',
};

/** The table view of the arc: the same data, readable without colour. */
export function SentenceBreakdown({ sentences }: { sentences: SentenceSentiment[] }) {
  if (sentences.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Sentiment score for each sentence</caption>
        <thead>
          <tr className="text-xs text-ink-soft uppercase">
            <th scope="col" className="py-1 pr-3 font-medium">
              Sentence
            </th>
            <th scope="col" className="py-1 pr-3 font-medium">
              Sentiment
            </th>
            <th scope="col" className="py-1 text-right font-medium">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {sentences.map((sentence) => (
            <tr key={sentence.id} className="border-t border-black/5">
              <td className="py-2 pr-3 text-ink">{sentence.text}</td>
              <td className={`py-2 pr-3 capitalize ${TONE_CLASS[sentence.label]}`}>
                {sentence.label}
              </td>
              <td className="py-2 text-right tabular-nums text-ink-soft">
                {sentence.scores.compound.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
