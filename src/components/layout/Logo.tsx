import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <Link to="/" className="font-display text-2xl font-bold text-ink hover:text-brand-600">
      uzor.
    </Link>
  );
}
