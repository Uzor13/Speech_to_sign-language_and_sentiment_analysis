import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { SpeechCapture } from './SpeechCapture';
import { TranscriptProvider, useTranscript } from '@/state/TranscriptContext';
import { FakeSpeechRecognition } from '@/test/fixtures/fakeRecognition';

function renderCapture() {
  const seen: string[] = [];
  function Probe() {
    const { text } = useTranscript();
    seen.push(text);
    return <output data-testid="shared">{text}</output>;
  }

  const utils = render(
    <MemoryRouter>
      <TranscriptProvider>
        <SpeechCapture />
        <Probe />
      </TranscriptProvider>
    </MemoryRouter>,
  );
  return { ...utils, seen };
}

describe('SpeechCapture', () => {
  it('tells the user plainly when the browser cannot listen', () => {
    // Firefox has no SpeechRecognition; a dead button would be worse.
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    renderCapture();

    expect(screen.getByText(/this browser cannot listen/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start listening/i })).not.toBeInTheDocument();
    // …and offers the typing fallback instead.
    expect(screen.getByLabelText(/type instead/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('falls back to typed text that reaches the shared transcript', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    renderCapture();

    fireEvent.change(screen.getByLabelText(/type instead/i), {
      target: { value: 'hello there' },
    });
    fireEvent.click(screen.getByRole('button', { name: /use this text/i }));

    expect(screen.getByTestId('shared')).toHaveTextContent('hello there');

    vi.unstubAllGlobals();
  });

  it('shows the live transcript and shares it as it grows', () => {
    const recognition = new FakeSpeechRecognition();
    vi.stubGlobal('SpeechRecognition', function () {
      return recognition;
    });

    renderCapture();

    fireEvent.click(screen.getByRole('button', { name: /start listening/i }));
    act(() => recognition.emitInterim('I am go'));

    expect(screen.getByLabelText('Transcript')).toHaveTextContent('I am go');

    act(() => recognition.emitFinal('I am going home'));

    expect(screen.getByLabelText('Transcript')).toHaveTextContent('I am going home');
    expect(screen.getByTestId('shared')).toHaveTextContent('I am going home');

    vi.unstubAllGlobals();
  });

  it('surfaces a blocked microphone with recovery instructions', () => {
    const recognition = new FakeSpeechRecognition();
    vi.stubGlobal('SpeechRecognition', function () {
      return recognition;
    });

    renderCapture();
    fireEvent.click(screen.getByRole('button', { name: /start listening/i }));
    act(() => recognition.emitError('not-allowed'));

    expect(screen.getByText(/microphone blocked/i)).toBeInTheDocument();
    expect(screen.getByText(/set Microphone to Allow/i)).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
