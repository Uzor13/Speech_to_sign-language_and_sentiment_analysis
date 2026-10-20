import { useEffect, useMemo, useState } from 'react';

import { englishToGlossSync } from '@/lib/gloss/translate';
import { heuristicTagger, type Tagger } from '@/lib/gloss/tagger';
import { loadCompromiseTagger } from '@/lib/gloss/tagger.compromise';
import { DEFAULT_DIALECT } from '@/lib/gloss/dialects';
import type { Dialect, GlossResult, TranslateOptions } from '@/lib/gloss/types';

/**
 * Translate text to gloss, upgrading from the heuristic tagger to the
 * compromise-backed one once it has loaded.
 *
 * The result is a `useMemo` over the text, never state: it is derived data, and
 * a pure function already computes it.
 */
export function useGloss(
  text: string,
  options: TranslateOptions = {},
  dialect: Dialect = DEFAULT_DIALECT,
): { gloss: GlossResult; taggerId: string } {
  const [tagger, setTagger] = useState<Tagger>(heuristicTagger);

  useEffect(() => {
    let active = true;
    loadCompromiseTagger().then((loaded) => {
      if (active) setTagger(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const { topicComment = false, stripFillers = true } = options;

  const gloss = useMemo(
    () => englishToGlossSync(text, dialect, tagger, { topicComment, stripFillers }),
    [text, dialect, tagger, topicComment, stripFillers],
  );

  return { gloss, taggerId: tagger.id };
}
