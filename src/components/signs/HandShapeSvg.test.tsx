import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { HandShapeSvg } from './HandShapeSvg';
import { ASL_HANDSHAPES } from './handshapes';
import { ASL_ALPHABET } from '@/lib/gloss/dialects/asl/alphabet';

/** The x of the tallest finger rect — i.e. which finger is raised. */
function raisedFingerX(letter: string): number | null {
  const { container } = render(<HandShapeSvg letter={letter} />);
  const rects = [...container.querySelectorAll('rect')];

  let best: { x: number; height: number } | null = null;
  for (const rect of rects) {
    const height = Number(rect.getAttribute('height'));
    const width = Number(rect.getAttribute('width'));
    // Fingers are tall and narrow; the palm and thumb are not.
    if (width > 12 || height < 20) continue;
    if (!best || height > best.height) best = { x: Number(rect.getAttribute('x')), height };
  }
  return best?.x ?? null;
}

describe('HandShapeSvg', () => {
  it('covers every letter of the alphabet', () => {
    for (const letter of ASL_ALPHABET.letters) {
      expect(ASL_HANDSHAPES[letter], letter).toBeDefined();
    }
  });

  it('renders something for every letter', () => {
    for (const letter of ASL_ALPHABET.letters) {
      const { container } = render(<HandShapeSvg letter={letter} />);
      expect(container.querySelector('svg'), letter).toBeInTheDocument();
    }
  });

  it('raises the index finger for D and the pinky for I', () => {
    // D and I are both "one finger up"; which finger it is, is the whole
    // difference between them.
    const d = raisedFingerX('d');
    const i = raisedFingerX('i');

    expect(d).not.toBeNull();
    expect(i).not.toBeNull();
    expect(i as number).toBeGreaterThan(d as number);
  });

  it('gives Y the same raised finger as I, differing only in the thumb', () => {
    expect(raisedFingerX('y')).toBe(raisedFingerX('i'));
  });

  it('draws no palm behind C and O, which are a curve', () => {
    // With a palm behind it, O read as a padlock rather than a circle.
    const { container } = render(<HandShapeSvg letter="o" />);
    expect(container.querySelector('circle')).toBeInTheDocument();
    const wide = [...container.querySelectorAll('rect')].filter(
      (r) => Number(r.getAttribute('width')) > 30,
    );
    expect(wide).toHaveLength(0);
  });

  it('crosses the fingers for R, which is what separates it from U', () => {
    const { container } = render(<HandShapeSvg letter="r" />);
    const tilted = [...container.querySelectorAll('g[transform*="rotate"]')];
    expect(tilted.length).toBeGreaterThanOrEqual(2);
  });

  it('shows a motion path for J and Z but not for a static letter', () => {
    for (const letter of ['j', 'z']) {
      const { container } = render(<HandShapeSvg letter={letter} />);
      expect(container.querySelector('path[stroke-dasharray]'), letter).toBeInTheDocument();
    }
    const { container } = render(<HandShapeSvg letter="a" />);
    expect(container.querySelector('path[stroke-dasharray]')).not.toBeInTheDocument();
  });

  it('is labelled for screen readers only when given a title', () => {
    const { container: titled } = render(<HandShapeSvg letter="a" title="Letter A" />);
    expect(titled.querySelector('svg')).toHaveAttribute('aria-label', 'Letter A');

    const { container: plain } = render(<HandShapeSvg letter="a" />);
    expect(plain.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders nothing for a character with no handshape', () => {
    const { container } = render(<HandShapeSvg letter="1" />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
