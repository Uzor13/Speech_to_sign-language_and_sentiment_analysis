import { Link } from 'react-router-dom';

import { Banner } from '@/components/ui/Banner';
import type { SignStep } from '@/lib/signs/types';

interface MissingAssetNoticeProps {
  steps: SignStep[];
  failed: ReadonlySet<string>;
}

/** Names the clips that 404'd, rather than letting them fail silently. */
export function MissingAssetNotice({ steps, failed }: MissingAssetNoticeProps) {
  if (failed.size === 0) return null;

  const names = steps
    .filter((s) => failed.has(s.id) && s.kind === 'video')
    .map((s) => (s.kind === 'video' ? s.gloss : ''))
    .filter(Boolean);

  if (names.length === 0) return null;

  return (
    <Banner tone="warning" title="Some clips could not be loaded">
      <p>
        {names.join(', ')} {names.length === 1 ? 'is' : 'are'} listed in the manifest but the
        file could not be fetched, so {names.length === 1 ? 'it was' : 'they were'} skipped.{' '}
        <Link className="underline" to="/signs">
          Check the sign library
        </Link>
        .
      </p>
    </Banner>
  );
}
