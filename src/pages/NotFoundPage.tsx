import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <p className="font-display text-5xl font-semibold text-brand-200">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
