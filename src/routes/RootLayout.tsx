import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Spinner } from '@/components/ui/Spinner';
import { TranscriptProvider } from '@/state/TranscriptContext';

export default function RootLayout() {
  return (
    <TranscriptProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <Spinner label="Loading…" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </TranscriptProvider>
  );
}
