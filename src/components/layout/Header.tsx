import { Logo } from './Logo';
import { Nav } from './Nav';
import { NavSocials } from './NavSocials';

export function Header() {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Logo />
        <Nav />
        <NavSocials />
      </div>
    </header>
  );
}
