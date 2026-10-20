import { SPEEDS, type PlayerStatus, type Speed } from '@/hooks/signSequenceReducer';

interface PlayerControlsProps {
  status: PlayerStatus;
  speed: Speed;
  index: number;
  length: number;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onSpeed: (speed: number) => void;
}

const ICON = 'h-4 w-4 fill-current';

export function PlayerControls({
  status,
  speed,
  index,
  length,
  onToggle,
  onPrev,
  onNext,
  onRestart,
  onSpeed,
}: PlayerControlsProps) {
  const playing = status === 'playing';
  const disabled = length === 0;

  const btn =
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-brand-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button type="button" className={btn} onClick={onPrev} disabled={disabled || index === 0} aria-label="Previous sign">
        <svg viewBox="0 0 24 24" className={ICON} aria-hidden="true">
          <path d="M7 6h2v12H7zm3 6l8-6v12z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={playing ? 'Pause' : 'Play'}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-200"
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M8 5l12 7-12 7z" />
          </svg>
        )}
      </button>

      <button
        type="button"
        className={btn}
        onClick={onNext}
        disabled={disabled || (index >= length - 1 && status === 'ended')}
        aria-label="Next sign"
      >
        <svg viewBox="0 0 24 24" className={ICON} aria-hidden="true">
          <path d="M15 6h2v12h-2zM6 6l8 6-8 6z" />
        </svg>
      </button>

      <button type="button" className={btn} onClick={onRestart} disabled={disabled} aria-label="Replay from the start">
        <svg viewBox="0 0 24 24" className={ICON} aria-hidden="true">
          <path d="M12 5V2L7 6l5 4V7a5 5 0 11-5 5H5a7 7 0 107-7z" />
        </svg>
      </button>

      <div className="ml-2 flex items-center gap-1" role="group" aria-label="Playback speed">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeed(s)}
            aria-pressed={speed === s}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              speed === s
                ? 'bg-brand-500 text-white'
                : 'text-ink-soft hover:bg-brand-50 hover:text-brand-600'
            }`}
          >
            {s}&times;
          </button>
        ))}
      </div>

      {length > 0 && (
        <p className="ml-2 text-xs text-ink-soft" aria-live="off">
          {Math.min(index + 1, length)} / {length}
        </p>
      )}
    </div>
  );
}
