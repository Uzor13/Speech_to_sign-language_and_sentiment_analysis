interface MicButtonProps {
  listening: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({ listening, disabled, onStart, onStop }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={listening ? onStop : onStart}
      disabled={disabled}
      aria-pressed={listening}
      className={`inline-flex items-center gap-2.5 rounded-full px-5 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 ${
        listening ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-500 hover:bg-brand-600'
      }`}
    >
      <span className="relative flex h-3 w-3" aria-hidden="true">
        {listening && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
        )}
        <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
      </span>
      {listening ? 'Stop listening' : 'Start listening'}
    </button>
  );
}
