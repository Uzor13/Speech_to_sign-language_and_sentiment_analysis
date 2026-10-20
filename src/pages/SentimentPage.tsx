import { PageHeading } from '@/components/layout/PageHeading';
import { SecondarySection } from '@/components/layout/SecondarySection';
import { SignPipeline } from '@/components/signs/SignPipeline';
import { SpeechCapture } from '@/components/speech/SpeechCapture';
import { SentimentPanel } from '@/components/sentiment/SentimentPanel';
import { useTranscript } from '@/state/TranscriptContext';
import sentimentIllustration from '@/assets/illustrations/sentiment-analysis.svg';

export default function SentimentPage() {
  const { text, segments } = useTranscript();

  return (
    <div>
      <PageHeading
        title="Speech to Sentiment Analysis"
        lead="Speak, and see not just whether you sounded positive but how the feeling moved from sentence to sentence."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SpeechCapture />
          {!text && (
            <img
              src={sentimentIllustration}
              alt=""
              className="mx-auto mt-2 w-full max-w-xs -scale-x-100 opacity-90"
            />
          )}
        </div>

        <SentimentPanel text={text} segments={segments} />
      </div>

      {text.trim() && (
        <SecondarySection
          title="The same words, signed"
          hint="Press play when you want to watch it — it will not start on its own."
        >
          {/* autoPlay off on purpose: signing is secondary here, and a player
              that starts by itself while you are reading scores is a nuisance. */}
          <SignPipeline text={text} autoPlay={false} compact />
        </SecondarySection>
      )}
    </div>
  );
}
