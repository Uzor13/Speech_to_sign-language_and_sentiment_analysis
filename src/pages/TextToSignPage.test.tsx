import { describe, expect, it, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import TextToSignPage from './TextToSignPage';
import { TranscriptProvider } from '@/state/TranscriptContext';
import { __resetManifestCache } from '@/lib/signs/manifest';
import { TEST_MANIFEST } from '@/test/fixtures/manifest';

/** Serve a manifest, or a 404, to exercise both asset states. */
function stubManifest(manifest: unknown | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      manifest === null
        ? ({ ok: false, status: 404, json: async () => ({}) } as Response)
        : ({ ok: true, status: 200, json: async () => manifest } as Response),
    ),
  );
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <TranscriptProvider>
        <TextToSignPage />
      </TranscriptProvider>
    </MemoryRouter>,
  );

async function translate(text: string) {
  fireEvent.change(screen.getByLabelText(/english text/i), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: /^translate$/i }));
  await waitFor(() => expect(screen.getByRole('list', { name: 'Gloss' })).toBeInTheDocument());
}

/** The gloss row as a space-separated string, read per chip. */
const glossText = () =>
  within(screen.getByRole('list', { name: 'Gloss' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent?.trim() ?? '')
    .join(' ')
    .trim();

const timeline = () => screen.getByRole('list', { name: /sign sequence/i });

beforeEach(() => {
  __resetManifestCache();
  vi.unstubAllGlobals();
});

describe('TextToSignPage', () => {
  it('translates typed English into gloss end to end', async () => {
    stubManifest(TEST_MANIFEST);
    renderPage();

    await translate("I don't like apples");

    expect(glossText()).toBe('ME NOT LIKE APPLE');
  });

  it('explains which words it dropped and why', async () => {
    stubManifest(TEST_MANIFEST);
    renderPage();

    await translate('The girl is drinking water');
    expect(glossText()).toBe('GIRL DRINK WATER');

    fireEvent.click(screen.getByRole('button', { name: /why this gloss/i }));

    expect(screen.getByText(/ASL has no articles/i)).toBeInTheDocument();
    // "is" here fronts a verb, so it goes as an auxiliary rather than a copula.
    expect(screen.getByText(/only carries tense for "drinking"/i)).toBeInTheDocument();
    expect(screen.getByText(/ASL verbs are uninflected/i)).toBeInTheDocument();
  });

  it('explains dropping the copula when there is no verb to carry', async () => {
    stubManifest(TEST_MANIFEST);
    renderPage();

    await translate('My father is not here');
    fireEvent.click(screen.getByRole('button', { name: /why this gloss/i }));

    expect(screen.getByText(/no verb "to be"/i)).toBeInTheDocument();
    expect(screen.getByText(/no verb to negate/i)).toBeInTheDocument();
  });

  it('reports coverage against the manifest', async () => {
    stubManifest(TEST_MANIFEST);
    renderPage();

    await translate('The girl is drinking water');

    // DRINK has a clip in the fixture; GIRL and WATER do not.
    await waitFor(() =>
      expect(screen.getByText(/1 of 3 words have a sign clip/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/2 fingerspelled/i)).toBeInTheDocument();
  });

  it('still signs everything when there is no manifest at all', async () => {
    // The state this repository actually ships in.
    stubManifest(null);
    renderPage();

    await translate('My father is not here');
    expect(glossText()).toBe('MY FATHER HERE NOT');

    await waitFor(() =>
      expect(screen.getByText(/0 of 4 words have a sign clip/i)).toBeInTheDocument(),
    );

    // The timeline is never blank: every word is spelled instead.
    expect(within(timeline()).getAllByRole('button').length).toBeGreaterThan(0);
    expect(screen.getByRole('status', { name: /now signing/i })).toHaveTextContent(/spelling/i);
  });

  it('applies topic-comment reordering when switched on', async () => {
    stubManifest(TEST_MANIFEST);
    renderPage();

    await translate('I like apples');
    expect(glossText()).toBe('ME LIKE APPLE');

    fireEvent.click(screen.getByLabelText(/topic-comment/i));

    await waitFor(() => expect(glossText()).toBe('APPLE ME LIKE'));
  });

  it('clears the gloss when the text is cleared', async () => {
    stubManifest(TEST_MANIFEST);
    renderPage();

    await translate('I like apples');
    fireEvent.click(screen.getByRole('button', { name: /^clear$/i }));

    await waitFor(() => expect(screen.getByText(/nothing to sign yet/i)).toBeInTheDocument());
  });
});
