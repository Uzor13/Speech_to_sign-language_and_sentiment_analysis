import { useEffect, useMemo, useState } from 'react';

import { loadManifest } from '@/lib/signs/manifest';
import { EMPTY_MANIFEST } from '@/lib/signs/parse';
import { createRegistry } from '@/lib/signs/registry';
import type { SignRegistry } from '@/lib/signs/types';
import { getDialect } from '@/lib/gloss/dialects';

export interface UseSignManifestResult {
  registry: SignRegistry;
  loading: boolean;
  /** Manifest problems, shown in the sign library rather than the console. */
  errors: string[];
}

/**
 * The manifest is cached at module level in `loadManifest`, so every route that
 * calls this shares one fetch. That cache *is* the sharing mechanism — no
 * provider is needed for immutable data.
 */
export function useSignManifest(): UseSignManifestResult {
  const [state, setState] = useState<{ loading: boolean; errors: string[]; manifestKey: string }>(
    () => ({ loading: true, errors: [], manifestKey: 'empty' }),
  );
  const [manifest, setManifest] = useState(EMPTY_MANIFEST);

  useEffect(() => {
    let active = true;
    loadManifest().then((result) => {
      if (!active) return;
      setManifest(result.manifest);
      setState({ loading: false, errors: result.errors, manifestKey: 'loaded' });
    });
    return () => {
      active = false;
    };
  }, []);

  const registry = useMemo(
    () => createRegistry(manifest, getDialect(manifest.dialect).alphabet),
    [manifest],
  );

  return { registry, loading: state.loading, errors: state.errors };
}
