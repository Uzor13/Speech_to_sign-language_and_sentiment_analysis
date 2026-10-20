import { afterEach, describe, expect, it, vi } from 'vitest';

import { describeRecognitionError, getSpeechSupport } from './support';

/** Pose as a browser: the constructor, the UA, and Brave's marker object. */
function asBrowser({
  hasApi = true,
  brave = false,
  ua = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
  vendor = 'Google Inc.',
}: { hasApi?: boolean; brave?: boolean; ua?: string; vendor?: string } = {}) {
  vi.stubGlobal('SpeechRecognition', hasApi ? function () {} : undefined);
  vi.stubGlobal('webkitSpeechRecognition', undefined);

  const nav: Record<string, unknown> = { userAgent: ua, vendor };
  if (brave) nav.brave = { isBrave: async () => true };
  vi.stubGlobal('navigator', nav);
}

afterEach(() => vi.unstubAllGlobals());

describe('getSpeechSupport', () => {
  it('treats Chrome as usable', () => {
    asBrowser();
    expect(getSpeechSupport()).toMatchObject({ hasApi: true, usable: true, browserName: 'Chrome' });
  });

  it('treats Brave as having the API but not being usable', () => {
    // The bug this exists for: Brave ships the whole Web Speech API with no
    // Google speech service behind it, so feature detection says yes and every
    // attempt then fails as a *network* error — which reads as "you are
    // offline" to someone who is not.
    asBrowser({ brave: true, ua: 'Mozilla/5.0 Chrome/151.0.0.0 Safari/537.36' });
    const support = getSpeechSupport();

    expect(support.hasApi).toBe(true);
    expect(support.usable).toBe(false);
    expect(support.browserName).toBe('Brave');
    expect(support.blockedReason).toMatch(/nothing to do with your connection/i);
  });

  it('reports no API at all in Firefox', () => {
    asBrowser({ hasApi: false, ua: 'Mozilla/5.0 Firefox/130.0', vendor: '' });
    expect(getSpeechSupport()).toMatchObject({ hasApi: false, usable: false, browserName: 'Firefox' });
  });

  it('names Apple as the vendor in Safari', () => {
    asBrowser({ ua: 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', vendor: 'Apple Computer, Inc.' });
    expect(getSpeechSupport()).toMatchObject({ usable: true, browserName: 'Safari', vendor: 'apple' });
  });

  it('lets an unknown Chromium browser try rather than blocking it', () => {
    asBrowser({ ua: 'Mozilla/5.0 Chromium/151.0.0.0', vendor: '' });
    expect(getSpeechSupport().usable).toBe(true);
  });
});

describe('describeRecognitionError — network', () => {
  it('never claims the user is offline', () => {
    asBrowser();
    const error = describeRecognitionError('network', getSpeechSupport());
    expect(error.message).not.toMatch(/needs an internet connection/i);
    expect(error.message).toMatch(/VPN, firewall, content blocker/i);
  });

  it('explains the real cause on Brave instead of blaming the connection', () => {
    asBrowser({ brave: true });
    const error = describeRecognitionError('network', getSpeechSupport());
    expect(error.message).toMatch(/Brave/);
    expect(error.message).toMatch(/nothing to do with your connection/i);
  });

  it('names the vendor whose servers were unreachable', () => {
    asBrowser({ ua: 'Mozilla/5.0 Version/17.0 Safari/605.1.15', vendor: 'Apple Computer, Inc.' });
    expect(describeRecognitionError('network', getSpeechSupport()).message).toMatch(
      /Apple's servers/,
    );
  });

  it('still stops listening rather than retrying into a loop', () => {
    asBrowser();
    expect(describeRecognitionError('network', getSpeechSupport()).terminal).toBe(true);
  });

  it('works without a support object', () => {
    asBrowser();
    expect(describeRecognitionError('network').message).toBeTruthy();
  });
});
