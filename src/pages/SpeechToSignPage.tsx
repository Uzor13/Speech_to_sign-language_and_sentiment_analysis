import { PageHeading } from '@/components/layout/PageHeading';
import { SecondarySection } from '@/components/layout/SecondarySection';
import { SentimentPanel } from '@/components/sentiment/SentimentPanel';
import { SpeechCapture } from '@/components/speech/SpeechCapture';
import { SignPipeline } from '@/components/signs/SignPipeline';
import { useTranscript } from '@/state/TranscriptContext';
import speechIllustration from '@/assets/illustrations/speech-to-text.svg';

export default function SpeechToSignPage() {
  const { text, segments } = useTranscript();

  return (
    <div>
      <PageHeading
        title="Speech to Sign Language"
        lead="Speak, and watch what you said translated into sign language gloss and signed back."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SpeechCapture />
          {!text && (
            <img
              src={speechIllustration}
              alt=""
              className="mx-auto mt-4 w-full max-w-xs opacity-90"
            />
          )}
        </div>

        <SignPipeline text={text} />
      </div>

      {text.trim() && (
        <SecondarySection title="How it sounded" hint="The sentiment of what you just said.">
          <SentimentPanel text={text} segments={segments} compact />
        </SecondarySection>
      )}
    </div>
  );
}
