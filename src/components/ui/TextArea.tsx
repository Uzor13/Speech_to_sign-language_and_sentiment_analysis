import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  hideLabel?: boolean;
}

export function TextArea({ label, hint, hideLabel, id, className = '', ...rest }: TextAreaProps) {
  const inputId = id ?? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'mb-1 block text-sm font-medium text-ink-soft'}
      >
        {label}
      </label>
      <textarea
        id={inputId}
        aria-describedby={hintId}
        className={`w-full resize-y rounded-lg border border-black/10 bg-white px-3 py-2 text-base leading-relaxed text-ink placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 focus:outline-none ${className}`}
        {...rest}
      />
      {hint && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
