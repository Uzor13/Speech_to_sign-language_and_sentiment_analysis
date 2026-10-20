import { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SentimentPage from './SentimentPage';
import { TranscriptProvider, useTranscript } from '@/state/TranscriptContext';
import { __resetManifestCache } from '@/lib/signs/manifest';
import { TEST_MANIFEST } from '@/test/fixtures/manifest';

function Seed({ text }: { text: string }) {
  const { setText } = useTranscript();
  const seeded = useRef(false);
  if (!seeded.current) {
    seeded.current = true;
    setText(text, 'typed');
  }
  return null;
}

function renderPage(text: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => TEST_MANIFEST }) as Response),
  );
  return render(
    <MemoryRouter>
      <TranscriptProvider>
        <Seed text={text} />
        <SentimentPage />
      </TranscriptProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  __resetManifestCache();
  vi.unstubAllGlobals();
});

describe('SentimentPage', () => {
  it('also shows the signs for what was said', async () => {
    renderPage('I love this');
    await waitFor(() =>
      expect(screen.getByText(/the same words, signed/i)).toBeInTheDocument(),
    );
  });

  it('does not start the signs playing on its own', async () => {
    // Signing is secondary on this page: a player that starts by itself while
    // you are reading the scores is a nuisance.
    renderPage('I love this');
    await waitFor(() => expect(screen.getByRole('group', { name: /sign language player/i })).toBeInTheDocument());

    // Paused means the control still offers "Play", not "Pause".
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^pause$/i })).not.toBeInTheDocument();
  });

  it('shows nothing extra before anything has been said', () => {
    renderPage('');
    expect(screen.queryByText(/the same words, signed/i)).not.toBeInTheDocument();
  });
});
