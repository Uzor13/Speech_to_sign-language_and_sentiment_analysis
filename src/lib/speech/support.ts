import type { RecognitionError } from './types';

/** Whose servers actually transcribe the audio, where we can tell. */
export type SpeechVendor = 'google' | 'apple';

export interface SpeechSupport {
  /** The SpeechRecognition constructor exists. */
  hasApi: boolean;
  /**
   * The constructor exists *and* this browser is known to reach a recognition
   * service.
   *
   * These are not the same thing, which is the trap: a Chromium fork can ship
   * the whole Web Speech API and no service behind it, so feature detection
   * says yes and every attempt then fails with a network error.
   */
  usable: boolean;
  browserName: string;
  vendor: SpeechVendor | null;
  /** Why it cannot work, when the API exists but is not usable. */
  blockedReason?: string;
}

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (
    ((w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionCtor | undefined) ??
    null
  );
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

/** `navigator.brave` exists only in Brave, so this is a reliable sync check. */
function isBrave(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'brave' in navigator;
}

function brandList(): string[] {
  const data = (navigator as unknown as { userAgentData?: { brands?: { brand: string }[] } })
    .userAgentData;
  return data?.brands?.map((b) => b.brand) ?? [];
}

function detectBrowser(): { name: string; vendor: SpeechVendor | null; chromiumFork: boolean } {
  if (typeof navigator === 'undefined') {
    return { name: 'this browser', vendor: null, chromiumFork: false };
  }

  const ua = navigator.userAgent;
  const brands = brandList();
  const has = (needle: string) =>
    ua.includes(needle) || brands.some((b) => b.toLowerCase().includes(needle.toLowerCase()));

  if (isBrave()) return { name: 'Brave', vendor: null, chromiumFork: true };
  if (has('Edg')) return { name: 'Edge', vendor: 'google', chromiumFork: false };
  if (has('OPR') || has('Opera')) return { name: 'Opera', vendor: null, chromiumFork: true };
  if (has('Vivaldi')) return { name: 'Vivaldi', vendor: null, chromiumFork: true };
  if (has('Firefox')) return { name: 'Firefox', vendor: null, chromiumFork: false };

  // Chrome proper reports vendor "Google Inc."; a plain Chromium build does not.
  if (has('Chrome')) {
    const isGoogleChrome = navigator.vendor === 'Google Inc.' && !has('Chromium');
    return {
      name: isGoogleChrome ? 'Chrome' : 'this Chromium browser',
      vendor: isGoogleChrome ? 'google' : null,
      chromiumFork: !isGoogleChrome,
    };
  }

  if (has('Safari')) return { name: 'Safari', vendor: 'apple', chromiumFork: false };
  return { name: 'this browser', vendor: null, chromiumFork: false };
}

/**
 * What speech recognition can actually do here.
 *
 * Checked up front so the UI never offers a microphone button that cannot
 * work. Brave is the case that motivated this: it ships the Web Speech API
 * but removed Google's speech service, so recognition always fails — and it
 * fails as a network error, which reads as "you are offline" when you are not.
 */
export function getSpeechSupport(hasApiOverride?: boolean): SpeechSupport {
  // The override lets a caller that builds its own recogniser (the tests, via
  // the hook's injection seam) say so, rather than this guessing from globals.
  const hasApi = hasApiOverride ?? isSpeechRecognitionSupported();
  const { name, vendor, chromiumFork } = detectBrowser();

  if (!hasApi) {
    return { hasApi: false, usable: false, browserName: name, vendor: null };
  }

  if (isBrave()) {
    return {
      hasApi: true,
      usable: false,
      browserName: 'Brave',
      vendor: null,
      blockedReason:
        'Brave includes the speech recognition API but removed the Google speech service it depends on, so transcription always fails here — it has nothing to do with your connection.',
    };
  }

  // Other Chromium forks are a maybe: some ship the service, some do not. Let
  // them try rather than blocking, and explain it properly if it fails.
  return { hasApi: true, usable: true, browserName: name, vendor, chromiumFork } as SpeechSupport;
}

/**
 * Turn a recogniser error code into something a person can act on, and say
 * whether listening should stop for good.
 */
export function describeRecognitionError(
  code: string,
  support?: SpeechSupport,
): RecognitionError {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return {
        code,
        message:
          'Microphone access was blocked. Allow it for this site in your browser settings, then try again.',
        terminal: true,
      };

    case 'audio-capture':
      return {
        code,
        message: 'No microphone was found. Connect one and try again.',
        terminal: true,
      };

    case 'network': {
      // Deliberately not "you are offline". This error means the browser could
      // not reach *a speech service*, and the most common reason is that the
      // browser does not ship one.
      const browser = support?.browserName ?? 'This browser';
      const vendor =
        support?.vendor === 'apple'
          ? "Apple's servers"
          : support?.vendor === 'google'
            ? "Google's servers"
            : 'a speech service';

      if (support && !support.usable && support.blockedReason) {
        return { code, message: support.blockedReason, terminal: true };
      }

      return {
        code,
        message:
          `${browser} could not reach ${vendor} to transcribe the audio. Speech recognition is not done on your device, so it needs more than a working connection: a VPN, firewall, content blocker or privacy extension can block it, and some Chromium browsers ship without a speech service at all. Typing works regardless.`,
        terminal: true,
      };
    }

    case 'no-speech':
      return { code, message: 'No speech was detected. Still listening…', terminal: false };

    case 'aborted':
      return { code, message: 'Listening was interrupted.', terminal: false };

    case 'language-not-supported':
      return { code, message: 'That language is not supported by this browser.', terminal: true };

    default:
      return { code, message: `Speech recognition failed (${code}).`, terminal: false };
  }
}
