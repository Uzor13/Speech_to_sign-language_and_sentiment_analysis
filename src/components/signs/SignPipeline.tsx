import { useMemo } from 'react';

import { GlossStrip } from '@/components/gloss/GlossStrip';
import { RuleTrace } from '@/components/gloss/RuleTrace';
import { Banner } from '@/components/ui/Banner';
import { useGloss } from '@/hooks/useGloss';
import { useSignManifest } from '@/hooks/useSignManifest';
import { buildSequence } from '@/lib/signs/sequence';
import { coverageFor } from '@/lib/signs/coverage';
import { getDialect } from '@/lib/gloss/dialects';

import { SignSequencePlayer } from './SignSequencePlayer';
import { CoverageBadge } from './CoverageBadge';

interface SignPipelineProps {
  text: string;
  topicComment?: boolean;
  autoPlay?: boolean;
  /** Constrain the width where the signs are a secondary view on the page. */
  compact?: boolean;
}

/**
 * Text in, signs out: the one implementation of the pipeline, shared by
 * /text, /speech and /live so there is never more than one.
 */
export function SignPipeline({
  text,
  topicComment = false,
  autoPlay,
  compact,
}: SignPipelineProps) {
  const { registry, loading } = useSignManifest();
  const { gloss } = useGloss(text, { topicComment });

  const dialect = getDialect(registry.manifest.dialect);

  const sequence = useMemo(() => buildSequence(gloss.glosses, registry), [gloss.glosses, registry]);
  const coverage = useMemo(() => coverageFor(gloss.glosses, registry), [gloss.glosses, registry]);

  const nothingToSign = text.trim().length > 0 && sequence.steps.length === 0;

  return (
    <div className={`flex flex-col gap-4 ${compact ? 'mx-auto w-full max-w-2xl' : ''}`}>
      {gloss.glosses.length > 0 && <GlossStrip glosses={gloss.glosses} />}

      <SignSequencePlayer
        sequence={sequence}
        alphabet={dialect.alphabet}
        {...(autoPlay !== undefined ? { autoPlay } : {})}
      />

      {!loading && <CoverageBadge coverage={coverage} />}

      {nothingToSign && (
        <Banner tone="info">
          Nothing in that text can be signed or spelled — try words with letters in them.
        </Banner>
      )}

      <RuleTrace gloss={gloss} />
    </div>
  );
}
