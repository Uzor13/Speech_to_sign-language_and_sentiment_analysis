import { HandShapeSvg } from './HandShapeSvg';
import { getHandShape } from './handshapes';

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
 * With no assets in the repository at all, this still *shows* the sign: the
 * handshape is drawn as an SVG diagram, with the letter and a description
 * beside it. A real letter image, once added to the manifest, takes
 * precedence over the drawing.
 */
export function LetterFrame({ letter, src, description, position, word }: LetterFrameProps) {
  const upper = letter.toUpperCase();
  const drawable = getHandShape(letter) !== undefined;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
      {src ? (
        <img
          src={src}
          alt={`The handshape for the letter ${upper}`}
          className="max-h-56 object-contain"
        />
      ) : (
        <div className="flex items-center gap-5">
          {drawable && (
            <div className="rounded-2xl bg-white p-3 ring-1 ring-brand-200">
              <HandShapeSvg
                letter={letter}
                title={`The handshape for the letter ${upper}`}
                className="h-36 w-auto text-brand-500"
              />
            </div>
          )}
          <div
            aria-hidden="true"
            className="flex h-24 w-24 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-200"
          >
            <span className="font-display text-5xl font-semibold text-brand-600">{upper}</span>
          </div>
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
