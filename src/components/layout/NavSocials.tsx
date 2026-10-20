// Inline SVG rather than a Font Awesome CDN stylesheet: three icons are not
// worth a render-blocking external request.
const LINKS = [
  {
    href: 'https://github.com/uzor13',
    label: 'GitHub',
    path: 'M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0C17.6 4.6 18.6 5 18.6 5c.7 1.7.3 2.9.1 3.2a4.5 4.5 0 011.2 3.1c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0012 .3',
  },
  {
    href: 'https://linkedin.com/in/uzochukwuprecious',
    label: 'LinkedIn',
    path: 'M20.4 20.5h-3.6v-5.6c0-1.3-.5-2.3-1.7-2.3-.9 0-1.5.6-1.7 1.3-.1.2-.1.5-.1.8v5.8H9.7s0-9.5 0-10.5h3.6v1.5c.5-.7 1.3-1.8 3.2-1.8 2.4 0 4 1.5 4 4.8v6zM5.9 8.6h-.1c-1.2 0-2-.8-2-1.9 0-1 .8-1.8 2-1.8s2 .8 2 1.8c0 1-.8 1.9-2 1.9zm1.8 11.9H4.1V10h3.6v10.5zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6c0 1 .8 1.7 1.8 1.7h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z',
  },
  {
    href: 'https://uzor.codes',
    label: 'Website',
    path: 'M12 0a12 12 0 100 24 12 12 0 000-24zm0 2.2c1.4 0 2.8 2 3.4 5H8.6c.6-3 2-5 3.4-5zM8.2 9.4h7.6a21 21 0 010 5.2H8.2a21 21 0 010-5.2zm-2.3 5.2H2.5a9.8 9.8 0 010-5.2H6a23 23 0 000 5.2zm.3 2.2h2.4c.4 1.9 1 3.4 1.8 4.5a9.8 9.8 0 01-4.2-4.5zm5.8 4.9c-1.4 0-2.8-2-3.4-4.9h6.8c-.6 2.9-2 4.9-3.4 4.9zm3.4-9.4a23 23 0 000-5.2h3.5a9.8 9.8 0 010 5.2h-3.5zm-.2 2.2H18a9.8 9.8 0 01-4.2 4.5c.8-1.1 1.4-2.6 1.8-4.5zM18 7.2h-2.4c-.4-1.9-1-3.4-1.8-4.5A9.8 9.8 0 0118 7.2zM10.2 2.7c-.8 1.1-1.4 2.6-1.8 4.5H6A9.8 9.8 0 0110.2 2.7z',
  },
] as const;

export function NavSocials() {
  return (
    <div className="flex items-center gap-3">
      {LINKS.map(({ href, label, path }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={label}
          className="text-ink-soft transition-colors hover:text-brand-600"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
            <path d={path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
