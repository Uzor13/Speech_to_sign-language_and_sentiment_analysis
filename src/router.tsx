import { createBrowserRouter } from 'react-router-dom';

import RootLayout from './routes/RootLayout';
import RouteError from './routes/RouteError';

// Every leaf is lazy so the NLP tagger (compromise) only downloads on the
// sign routes, and the sentiment lexicon (VADER) only on the sentiment ones.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('./pages/HomePage')).default }) },
      { path: 'live', lazy: async () => ({ Component: (await import('./pages/LivePage')).default }) },
      { path: 'speech', lazy: async () => ({ Component: (await import('./pages/SpeechToSignPage')).default }) },
      { path: 'text', lazy: async () => ({ Component: (await import('./pages/TextToSignPage')).default }) },
      { path: 'sentiment', lazy: async () => ({ Component: (await import('./pages/SentimentPage')).default }) },
      { path: 'signs', lazy: async () => ({ Component: (await import('./pages/SignLibraryPage')).default }) },
      { path: '*', lazy: async () => ({ Component: (await import('./pages/NotFoundPage')).default }) },
    ],
  },
]);
