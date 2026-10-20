import '@testing-library/jest-dom/vitest';

// jsdom implements no media playback at all, so a <video> would throw on
// play(). Stub just enough for the sign player's tests.
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: () => Promise.resolve(),
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: () => {},
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: () => {},
});

// jsdom does not implement scrollIntoView.
Object.defineProperty(window.Element.prototype, 'scrollIntoView', {
  writable: true,
  value: () => {},
});
