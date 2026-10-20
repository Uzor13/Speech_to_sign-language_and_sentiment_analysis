import { getHandShape, type FingerState, type HandShape } from './handshapes';

/**
 * Renders a handshape as an SVG diagram.
 *
 * One parametric hand drives all 26 letters: a palm, four fingers whose length
 * and bend come from their state, and a thumb with a handful of poses. Drawing
 * it this way rather than as 26 separate illustrations keeps the shapes
 * consistent with one another, which is what makes them comparable.
 */

/** Each finger's full length; the middle finger is longest, as on a hand. */
const FINGERS = [
  { key: 'index', x: 33, length: 40 },
  { key: 'middle', x: 45, length: 46 },
  { key: 'ring', x: 57, length: 42 },
  { key: 'pinky', x: 68, length: 33 },
] as const;

const PALM_TOP = 58;
const FINGER_WIDTH = 9.5;

/** How much of its full length a finger shows in each state. */
const EXTENSION: Record<FingerState, number> = {
  extended: 1,
  half: 0.55,
  hooked: 0.62,
  curled: 0.3,
  folded: 0.1,
};

function Finger({
  x,
  length,
  state,
  offset,
}: {
  x: number;
  length: number;
  state: FingerState;
  offset: number;
}) {
  const shown = length * EXTENSION[state];
  const top = PALM_TOP - shown;
  const cx = x + offset;

  return (
    <g>
      <rect
        x={cx}
        y={top}
        width={FINGER_WIDTH}
        height={shown + 6}
        rx={FINGER_WIDTH / 2}
        fill="currentColor"
      />
      {/* A knuckle crease, so a bent finger reads as bent rather than short. */}
      {(state === 'half' || state === 'curled') && (
        <line
          x1={cx + 1}
          y1={top + 5}
          x2={cx + FINGER_WIDTH - 1}
          y2={top + 5}
          stroke="var(--color-hand-crease, rgba(255,255,255,0.55))"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      )}
      {/* X is a crook: the tip bends over, nothing else. */}
      {state === 'hooked' && (
        <path
          d={`M ${cx} ${top + 3} q ${FINGER_WIDTH / 2} -8 ${FINGER_WIDTH} 1`}
          fill="none"
          stroke="currentColor"
          strokeWidth={FINGER_WIDTH}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function Thumb({ shape }: { shape: HandShape }) {
  switch (shape.thumb) {
    case 'out':
      return (
        <rect x={-2} y={62} width={34} height={FINGER_WIDTH} rx={FINGER_WIDTH / 2} fill="currentColor" />
      );
    case 'side':
      return (
        <rect x={20} y={52} width={FINGER_WIDTH} height={30} rx={FINGER_WIDTH / 2} fill="currentColor" />
      );
    case 'up':
      return (
        <rect
          x={38}
          y={40}
          width={FINGER_WIDTH}
          height={30}
          rx={FINGER_WIDTH / 2}
          fill="currentColor"
          transform="rotate(-18 42 55)"
        />
      );
    case 'pinch':
      return (
        <rect
          x={24}
          y={48}
          width={FINGER_WIDTH}
          height={26}
          rx={FINGER_WIDTH / 2}
          fill="currentColor"
          transform="rotate(28 28 60)"
        />
      );
    case 'tucked':
      return (
        <rect x={34} y={66} width={26} height={FINGER_WIDTH} rx={FINGER_WIDTH / 2} fill="currentColor" opacity={0.55} />
      );
    case 'across':
    default:
      return (
        <rect x={26} y={66} width={32} height={FINGER_WIDTH} rx={FINGER_WIDTH / 2} fill="currentColor" />
      );
  }
}

/**
 * C and O are one continuous curve, not separate fingers — and the curve *is*
 * the hand, so no palm is drawn behind it. (With one, O read as a padlock.)
 */
function Curve({ kind }: { kind: 'c' | 'o' }) {
  return (
    <g>
      {kind === 'o' ? (
        <circle cx={52} cy={52} r={24} fill="none" stroke="currentColor" strokeWidth={12} />
      ) : (
        <path
          d="M 72 30 A 26 28 0 1 0 72 80"
          fill="none"
          stroke="currentColor"
          strokeWidth={12}
          strokeLinecap="round"
        />
      )}
      {/* A short wrist, so the shape still reads as a hand. */}
      <rect x={44} y={86} width={17} height={20} rx={8} fill="currentColor" />
    </g>
  );
}

/** J and Z are movements; show the path the hand travels. */
function Motion({ kind }: { kind: 'j' | 'z' }) {
  const d = kind === 'j' ? 'M 76 86 v 14 q 0 12 -16 12' : 'M 22 96 h 30 l -30 18 h 30';
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="5 5"
      opacity={0.55}
    />
  );
}

export function HandShapeSvg({
  letter,
  className = '',
  title,
}: {
  letter: string;
  className?: string;
  title?: string;
}) {
  const shape = getHandShape(letter);
  if (!shape) return null;

  const spreadFor = (index: number) => {
    if (!shape.spread) return 0;
    return (index - 1.2) * 3.5;
  };

  /** R genuinely crosses index over middle; without the tilt it reads as U. */
  const tiltFor = (key: string) => {
    if (!shape.cross) return undefined;
    if (key === 'index') return 'rotate(14 38 52)';
    if (key === 'middle') return 'rotate(-14 50 52)';
    return undefined;
  };

  return (
    <svg
      viewBox="0 0 100 125"
      className={className}
      role="img"
      {...(title ? { 'aria-label': title } : { 'aria-hidden': true })}
    >
      <g transform={shape.rotate ? `rotate(${shape.rotate} 50 70)` : undefined}>
        {/* Palm — omitted for C and O, where the curve is the whole hand. */}
        {!shape.curve && (
          <rect x={28} y={PALM_TOP - 4} width={48} height={46} rx={13} fill="currentColor" />
        )}

        {shape.curve ? (
          <Curve kind={shape.curve} />
        ) : (
          <>
            <Thumb shape={shape} />
            {FINGERS.map((finger, i) => (
              <g key={finger.key} transform={tiltFor(finger.key)}>
                <Finger
                  x={finger.x}
                  length={finger.length}
                  state={shape[finger.key]}
                  offset={spreadFor(i)}
                />
              </g>
            ))}
            {/* M, N and T bury the thumb beneath a number of fingers. */}
            {shape.tuckedUnder !== undefined &&
              FINGERS.slice(0, shape.tuckedUnder).map((finger) => (
                <rect
                  key={`tuck-${finger.key}`}
                  x={finger.x}
                  y={PALM_TOP - 10}
                  width={FINGER_WIDTH}
                  height={16}
                  rx={FINGER_WIDTH / 2}
                  fill="currentColor"
                />
              ))}
          </>
        )}
      </g>

      {shape.motion && <Motion kind={shape.motion} />}
    </svg>
  );
}
