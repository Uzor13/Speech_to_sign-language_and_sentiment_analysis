export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/5 px-4 py-6 text-center text-sm text-ink-soft sm:px-6">
      <p>
        Speech recognition and sentiment analysis run in your browser. No account, no API keys.
      </p>
      {/* Storyset's licence requires attribution for the illustrations. */}
      <p className="mt-1">
        <a className="text-brand-600 hover:underline" href="https://storyset.com/data">
          Data illustrations by Storyset
        </a>
      </p>
    </footer>
  );
}
