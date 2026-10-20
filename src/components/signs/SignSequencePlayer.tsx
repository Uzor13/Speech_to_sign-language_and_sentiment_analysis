import { useCallback, useEffect, useRef } from 'react';

import { useSignSequence } from '@/hooks/useSignSequence';
import { usePreloadVideos } from '@/hooks/usePreloadVideos';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { SignSequence } from '@/lib/signs/types';
import type { Alphabet } from '@/lib/gloss/types';

import { SignStepView } from './SignStepView';
import { CaptionStrip } from './CaptionStrip';
import { PlayerControls } from './PlayerControls';
import { SignTimeline } from './SignTimeline';
import { MissingAssetNotice } from './MissingAssetNotice';

interface SignSequencePlayerProps {
  sequence: SignSequence;
  alphabet: Alphabet;
  autoPlay?: boolean;
}

/** Playback is finished if a video takes more than this multiple of its length. */
const STALL_FACTOR = 3;

export function SignSequencePlayer({
  sequence,
  alphabet,
  autoPlay,
}: SignSequencePlayerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const player = useSignSequence(sequence, {
    // Reduced motion means step mode by default: nothing advances on its own.
    autoPlay: autoPlay ?? !reducedMotion,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const { step, status, speed, index, length, notifyStepEnded, notifyStepFailed } = player;

  // The id of the step on screen, read by listeners that are attached once.
  const stepIdRef = useRef<string | undefined>(undefined);
  stepIdRef.current = step?.id;

  // Attached once. The old implementation re-attached on every index change and
  // closed over a stale index, which is why it replayed the same clip.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onEnded = () => notifyStepEnded();
    const onError = () => {
      if (stepIdRef.current) notifyStepFailed(stepIdRef.current);
    };

    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [notifyStepEnded, notifyStepFailed]);

  // Clock one: video steps. Set the source, then play — in that order.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || step?.kind !== 'video') return;

    if (!el.src.endsWith(step.src)) {
      el.src = step.src;
      el.load();
    }
    el.playbackRate = speed;

    if (status === 'playing') {
      // A blocked autoplay is a pause, not an error.
      el.play().catch(() => player.pause());
    } else {
      el.pause();
    }
  }, [step, status, speed, player]);

  // Watchdog, so a clip that never fires `ended` cannot stall the timeline.
  useEffect(() => {
    if (status !== 'playing' || step?.kind !== 'video') return;
    const timer = setTimeout(
      () => notifyStepEnded(),
      (step.durationMs * STALL_FACTOR) / speed,
    );
    return () => clearTimeout(timer);
  }, [status, step, speed, notifyStepEnded]);

  usePreloadVideos(sequence.steps, index);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const actions: Record<string, () => void> = {
        ' ': player.toggle,
        Spacebar: player.toggle,
        ArrowRight: player.next,
        ArrowLeft: player.prev,
        r: player.restart,
        R: player.restart,
      };
      const action = actions[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    },
    [player],
  );

  return (
    <div
      role="group"
      aria-label="Sign language player"
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex flex-col gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      <SignStepView
        step={step}
        videoRef={videoRef}
        describeLetter={(letter) => alphabet.describe(letter)}
        failed={step ? player.isFailed(step.id) : false}
        empty={length === 0}
      />

      <CaptionStrip step={step} />

      <PlayerControls
        status={status}
        speed={speed}
        index={index}
        length={length}
        onToggle={player.toggle}
        onPrev={player.prev}
        onNext={player.next}
        onRestart={player.restart}
        onSpeed={player.setSpeed}
      />

      <SignTimeline
        steps={sequence.steps}
        index={index}
        isFailed={player.isFailed}
        onSeek={player.seek}
      />

      <MissingAssetNotice steps={sequence.steps} failed={player.failed} />

      <p className="text-center text-xs text-slate-400">
        Space plays and pauses, arrow keys step, R replays.
      </p>
    </div>
  );
}
