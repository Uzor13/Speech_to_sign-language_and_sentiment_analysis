import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useSentiment } from '@/hooks/useSentiment';
import type { TranscriptSegment } from '@/lib/speech/types';

import { SentimentSummary } from './SentimentSummary';
import { SentimentArc } from './SentimentArc';
import { SentenceBreakdown } from './SentenceBreakdown';
import { TokenContributions } from './TokenContributions';

interface SentimentPanelProps {
  text: string;
  segments?: TranscriptSegment[];
  compact?: boolean;
}

/** The one sentiment view, shared by /sentiment and /live. */
export function SentimentPanel({ text, segments = [], compact }: SentimentPanelProps) {
  const { sentiment, contributions, loading } = useSentiment(text, segments);

  if (!text.trim()) {
    return (
      <Card>
        <p className="text-sm text-ink-soft">
          Say or type something and its sentiment will appear here.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <Spinner label="Loading the sentiment lexicon…" />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card title="Sentiment">
        <SentimentSummary sentiment={sentiment} />
      </Card>

      {sentiment.arc.length > 1 && (
        <Card>
          <SentimentArc arc={sentiment.arc} />
        </Card>
      )}

      {!compact && (
        <>
          <Card title="Sentence by sentence">
            <SentenceBreakdown sentences={sentiment.sentences} />
          </Card>

          <Card title="What drove it">
            <TokenContributions contributions={contributions} />
          </Card>
        </>
      )}
    </div>
  );
}
