import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { Banner } from '@/components/ui/Banner';

export default function RouteError() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'Something went wrong.';

  return (
    <div className="mx-auto max-w-xl py-12">
      <Banner tone="error" title="This page failed to load">
        <p className="font-mono text-xs break-words">{message}</p>
      </Banner>
      <Link to="/" className="mt-4 inline-block text-brand-600 hover:underline">
        ← Back to home
      </Link>
    </div>
  );
}
