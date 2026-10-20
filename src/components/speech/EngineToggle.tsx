import type { Dictation } from '@/hooks/useDictation';

/** Lets the user choose between the browser's recogniser and the local model. */
export function EngineToggle({ dictation }: { dictation: Dictation }) {
  const { engine, support, canUseLocal, useLocalEngine, isListening } = dictation;

  // Only worth showing when there is a genuine choice to make.
  if (!canUseLocal || !support.usable) return null;

  const options = [
    { id: 'browser' as const, label: support.browserName, hint: 'Instant, streams word by word' },
    { id: 'local' as const, label: 'On device', hint: 'Private, ~40 MB once' },
  ];

  return (
    <div role="group" aria-label="Recognition engine" className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-soft">Transcribe with</span>
      <div className="flex rounded-lg bg-slate-100 p-0.5">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={isListening}
            onClick={() => useLocalEngine(option.id === 'local')}
            aria-pressed={engine === option.id}
            title={option.hint}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              engine === option.id
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-ink-soft hover:text-brand-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
