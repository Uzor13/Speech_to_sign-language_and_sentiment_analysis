interface LetterFrameProps {
  letter: string;
  /** Present only once a letter image has been added to public/signs/letters. */
  src?: string;
  /** Handshape description from the dialect's alphabet. */
  description?: string;
  position?: { index: number; total: number };
  word?: string;
}

/**
 * The renderer that always works.
 *
 * With no assets in the repository at all, this is what the whole app falls
 * back to — a large letter plus the handshape description, so it still teaches
 * something. The moment a letter image is added to the manifest it is used
 * instead, with no code change.
 */
export function LetterFrame({ letter, src, description, position, word }: LetterFrameProps) {
  const upper = letter.toUpperCase();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      {src ? (
        <img
          src={src}
          alt={`The ASL handshape for the letter ${upper}`}
          className="max-h-56 object-contain"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-40 w-40 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-200"
        >
          <span className="font-display text-7xl font-semibold text-brand-600">{upper}</span>
        </div>
      )}

      <div className="max-w-sm">
        <p className="font-display text-lg font-semibold text-ink">
          <span className="sr-only">Fingerspelling the letter </span>
          {upper}
          {position && (
            <span className="ml-2 text-sm font-normal text-ink-soft">
              {position.index} of {position.total}
              {word ? ` in "${word}"` : ''}
            </span>
          )}
        </p>
        {description && !src && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
    </div>
  );
}
