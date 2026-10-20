import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SignSequencePlayer } from './SignSequencePlayer';
import { buildSequence } from '@/lib/signs/sequence';
import { createEmptyRegistry, createRegistry } from '@/lib/signs/registry';
import { ASL_ALPHABET } from '@/lib/gloss/dialects/asl/alphabet';
import { TEST_MANIFEST } from '@/test/fixtures/manifest';
import type { GlossToken } from '@/lib/gloss/types';

const sign = (gloss: string, source: string[]): GlossToken => ({
  id: `t-${gloss}`,
  gloss,
  kind: 'sign',
  source,
});

const renderPlayer = (glosses: GlossToken[], registry = createRegistry(TEST_MANIFEST, ASL_ALPHABET)) => {
  const sequence = buildSequence(glosses, registry);
  const utils = render(
    <MemoryRouter>
      <SignSequencePlayer sequence={sequence} alphabet={ASL_ALPHABET} autoPlay={false} />
    </MemoryRouter>,
  );
  return { ...utils, sequence };
};

const video = () => document.querySelector('video');

/** The live caption, not the timeline chips, which repeat the same glosses. */
const caption = () => screen.getByRole('status', { name: /now signing/i });

describe('SignSequencePlayer', () => {
  it('advances the caption when a clip ends', () => {
    renderPlayer([sign('FATHER', ['father']), sign('DRINK', ['drink'])]);

    expect(caption()).toHaveTextContent('FATHER');

    fireEvent.ended(video() as HTMLVideoElement);

    expect(caption()).toHaveTextContent('DRINK');
  });

  it('keeps the video mounted after the last step, so replay works', () => {
    // The old player unmounted the <video> when it finished, which made
    // replaying impossible.
    renderPlayer([sign('FATHER', ['father'])]);

    fireEvent.ended(video() as HTMLVideoElement);

    expect(video()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replay from the start/i })).toBeEnabled();
  });

  it('replays after finishing', () => {
    renderPlayer([sign('FATHER', ['father']), sign('DRINK', ['drink'])]);

    fireEvent.ended(video() as HTMLVideoElement);
    fireEvent.ended(video() as HTMLVideoElement);
    fireEvent.click(screen.getByRole('button', { name: /replay from the start/i }));

    expect(caption()).toHaveTextContent('FATHER');
  });

  it('skips a clip that fails to load and names it, rather than stalling', () => {
    renderPlayer([sign('GONE', ['gone']), sign('DRINK', ['drink'])]);

    fireEvent.error(video() as HTMLVideoElement);

    expect(caption()).toHaveTextContent('DRINK');
    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });

  it('renders a drawn letter card when there is no letter image', () => {
    // 'z' has no image in the test manifest, so the handshape text is shown.
    renderPlayer([sign('Z', ['z'])]);
    expect(screen.getByText(/index finger extended, tracing/i)).toBeInTheDocument();
  });

  it('uses the letter image when one exists', () => {
    renderPlayer([sign('A', ['a'])]);
    expect(screen.getByAltText(/handshape for the letter A/i)).toHaveAttribute(
      'src',
      '/signs/letters/a.png',
    );
  });

  it('spells everything when the manifest is empty', () => {
    renderPlayer([sign('FATHER', ['father'])], createEmptyRegistry(ASL_ALPHABET));
    expect(caption()).toHaveTextContent(/spelling "father"/i);
  });

  it('steps with the keyboard', () => {
    renderPlayer([sign('FATHER', ['father']), sign('DRINK', ['drink'])]);
    const group = screen.getByRole('group', { name: /sign language player/i });

    fireEvent.keyDown(group, { key: 'ArrowRight' });
    expect(caption()).toHaveTextContent('DRINK');

    fireEvent.keyDown(group, { key: 'ArrowLeft' });
    expect(caption()).toHaveTextContent('FATHER');
  });

  it('shows an empty state with nothing to sign', () => {
    renderPlayer([]);
    expect(screen.getByText(/nothing to sign yet/i)).toBeInTheDocument();
  });
});
