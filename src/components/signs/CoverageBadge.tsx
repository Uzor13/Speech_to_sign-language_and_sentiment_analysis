import { Link } from 'react-router-dom';

import type { CoverageReport } from '@/lib/signs/types';

/**
 * Makes gaps in the sign corpus visible: without this, users wonder why half a
 * sentence is being spelled out letter by letter.
 */
export function CoverageBadge({ coverage }: { coverage: CoverageReport }) {
  if (coverage.total === 0) return null;

  const { withClips, total, fingerspelled } = coverage;

  return (
    <p className="text-center text-xs text-ink-soft">
      {withClips} of {total} {total === 1 ? 'word has' : 'words have'} a sign clip
      {fingerspelled > 0 && (
        <>
          {' · '}
          {fingerspelled} fingerspelled
        </>
      )}
      {' · '}
      <Link to="/signs" className="text-brand-600 hover:underline">
        add clips
      </Link>
    </p>
  );
}
