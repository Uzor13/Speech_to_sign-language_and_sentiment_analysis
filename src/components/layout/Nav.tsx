import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/live', label: 'Live' },
  { to: '/speech', label: 'Speech to Sign' },
  { to: '/text', label: 'Text to Sign' },
  { to: '/sentiment', label: 'Sentiment' },
  { to: '/signs', label: 'Sign Library' },
] as const;

export function Nav() {
  return (
    <ul className="flex flex-wrap items-center gap-1">
      {LINKS.map(({ to, label, ...rest }) => (
        <li key={to}>
          <NavLink
            to={to}
            {...rest}
            className={({ isActive }) =>
              `block rounded-md px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-ink-soft hover:bg-brand-50 hover:text-brand-600'
              }`
            }
          >
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
