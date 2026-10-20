import { Link } from 'react-router-dom';

import { Banner } from '@/components/ui/Banner';

/**
 * Firefox has no SpeechRecognition at all. Saying so plainly is better than a
 * button that silently does nothing.
 */
export function UnsupportedBanner() {
  return (
    <Banner tone="warning" title="This browser cannot listen">
      <p>
        Speech recognition is only available in Chrome, Edge and Safari. You can type instead —
        everything else on this page works the same.{' '}
        <Link className="underline" to="/text">
          Go to Text to Sign
        </Link>
        .
      </p>
    </Banner>
  );
}
