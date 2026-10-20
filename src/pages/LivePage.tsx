import { PageHeading } from '@/components/layout/PageHeading';
import { SpeechCapture } from '@/components/speech/SpeechCapture';
import { SignPipeline } from '@/components/signs/SignPipeline';
import { SentimentPanel } from '@/components/sentiment/SentimentPanel';
import { useTranscript } from '@/state/TranscriptContext';

/**
 * The whole idea on one screen: speak once, and the transcript, the signs and
 * the sentiment arc fill in together. Every other page is a preset over the
 * same three blocks, so there is one implementation of each, not four.
 */
export default function LivePage() {
  const { text, segments } = useTranscript();

  return (
    <div>
      <PageHeading
        title="Live"
        lead="Speak once. See what you said, how it signs, and how the feeling moved — all at the same time."
      />

      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-1">
            <h2 className="sr-only">Speech</h2>
            <SpeechCapture />
          </section>

          <section className="lg:col-span-2">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Signs</h2>
            <SignPipeline text={text} />
          </section>
        </div>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Sentiment</h2>
          <SentimentPanel text={text} segments={segments} />
        </section>
      </div>
    </div>
  );
}
