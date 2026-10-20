import { Banner } from '@/components/ui/Banner';
import type { SpeechSupport } from '@/lib/speech/support';

/**
 * Says why this browser cannot listen, specifically.
 *
 * Two different situations land here, and conflating them is unhelpful:
 * Firefox has no speech API at all, while Brave ships the API with no service
 * behind it — which otherwise shows up as a network error that reads like
 * "you are offline" when you are not.
 */
export function UnsupportedBanner({ support }: { support: SpeechSupport }) {
  const blocked = support.hasApi && !support.usable;

  return (
    <Banner
      tone="warning"
      title={
        blocked
          ? `${support.browserName} cannot transcribe speech`
          : `${support.browserName} cannot listen`
      }
    >
      <p>
        {support.blockedReason ??
          'This browser has no speech recognition support. It is available in Chrome, Edge and Safari.'}
      </p>
      <p className="mt-1.5">
        Type below instead — the signs and the sentiment work exactly the same way.
        {blocked && ' To dictate, open this page in Chrome, Edge or Safari.'}
      </p>
    </Banner>
  );
}
