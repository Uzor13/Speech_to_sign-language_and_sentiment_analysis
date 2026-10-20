import { useEffect } from 'react';

import type { SignStep } from '@/lib/signs/types';

/**
 * Warm the next couple of clips so there is no gap between signs. Detached
 * elements, never mounted — the browser caches the bytes and the visible
 * player picks them up instantly.
 */
export function usePreloadVideos(steps: SignStep[], index: number, lookahead = 2): void {
  useEffect(() => {
    const upcoming = steps
      .slice(index + 1)
      .filter((s): s is Extract<SignStep, { kind: 'video' }> => s.kind === 'video')
      .slice(0, lookahead);

    if (upcoming.length === 0) return;

    const elements = upcoming.map((step) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.src = step.src;
      return video;
    });

    return () => {
      for (const video of elements) {
        video.removeAttribute('src');
        video.load();
      }
    };
  }, [steps, index, lookahead]);
}
