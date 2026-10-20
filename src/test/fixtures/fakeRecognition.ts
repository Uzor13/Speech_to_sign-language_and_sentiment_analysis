/**
 * A controllable stand-in for the Web Speech API, so the hook can be tested
 * without a microphone, a network, or Chrome.
 */
export class FakeSpeechRecognition implements SpeechRecognitionLike {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;

  onresult: ((event: SpeechRecognitionEventLike) => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  onaudiostart: (() => void) | null = null;

  started = 0;
  stopped = 0;
  aborted = 0;
  running = false;

  /** Grows across emissions, the way the real `results` list does. */
  private results: Array<{ transcript: string; isFinal: boolean; confidence: number }> = [];

  start(): void {
    this.started += 1;
    this.running = true;
    this.onstart?.();
    this.onaudiostart?.();
  }

  stop(): void {
    this.stopped += 1;
    this.running = false;
    this.onend?.();
  }

  abort(): void {
    this.aborted += 1;
    this.running = false;
  }

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return true;
  }

  private emit(transcript: string, isFinal: boolean, confidence: number): void {
    const resultIndex = this.results.length;
    this.results.push({ transcript, isFinal, confidence });

    const list = this.results.map((r) => {
      const alternative = { transcript: r.transcript, confidence: r.confidence };
      const result = {
        isFinal: r.isFinal,
        length: 1,
        item: () => alternative,
        0: alternative,
      };
      return result as unknown as SpeechRecognitionResultLike;
    });

    const results = Object.assign(list, {
      length: list.length,
      item: (i: number) => list[i] as SpeechRecognitionResultLike,
    }) as unknown as SpeechRecognitionResultListLike;

    this.onresult?.({ resultIndex, results } as SpeechRecognitionEventLike);
  }

  /** Interim results replace the previous interim for the same utterance. */
  emitInterim(transcript: string): void {
    const last = this.results[this.results.length - 1];
    if (last && !last.isFinal) {
      this.results.pop();
    }
    this.emit(transcript, false, 0);
  }

  emitFinal(transcript: string, confidence = 0.9): void {
    const last = this.results[this.results.length - 1];
    if (last && !last.isFinal) this.results.pop();
    this.emit(transcript, true, confidence);
  }

  emitError(code: string): void {
    this.onerror?.({ error: code, message: code } as SpeechRecognitionErrorEventLike);
  }

  /** Session ended on its own, as Chrome does after a silence. */
  emitEnd(): void {
    this.running = false;
    this.onend?.();
  }
}
