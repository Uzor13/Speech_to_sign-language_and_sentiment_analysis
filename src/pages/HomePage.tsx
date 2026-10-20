import { Link } from 'react-router-dom';

import sentimentIllustration from '@/assets/illustrations/sentiment-analysis.svg';

const CARDS = [
  {
    to: '/live',
    title: 'Live',
    body: 'Speak once and watch the transcript, the signs and the sentiment arc fill in together.',
  },
  {
    to: '/speech',
    title: 'Speech to Sign',
    body: 'Say something and see it rendered as a sequence of signs, glossed word by word.',
  },
  {
    to: '/text',
    title: 'Text to Sign',
    body: 'Type instead of speaking. Works in every browser, with or without a microphone.',
  },
  {
    to: '/sentiment',
    title: 'Sentiment',
    body: 'See how the feeling of an utterance moves from sentence to sentence, not just one score.',
  },
] as const;

export default function HomePage() {
  return (
    <div>
      <section className="flex flex-col items-center gap-8 md:flex-row">
        <div className="md:w-1/2">
          <h1 className="font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            A <span className="text-brand-500">Speech to Sign Language</span> and{' '}
            <span className="text-brand-500">Sentiment Analysis</span> system
          </h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">
            Speak or type in English. The app transcribes it, translates it into sign
            language gloss, plays the signs, and shows how the sentiment moves across
            what you said.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/live"
              className="rounded-md bg-brand-500 px-6 py-3 font-medium text-white transition-colors hover:bg-brand-600"
            >
              Try it live
            </Link>
            <Link
              to="/text"
              className="rounded-md bg-white px-6 py-3 font-medium text-brand-600 ring-1 ring-brand-200 transition-colors hover:bg-brand-50"
            >
              Type instead
            </Link>
          </div>
        </div>
        <div className="md:w-1/2">
          <img
            src={sentimentIllustration}
            alt=""
            className="mx-auto w-full max-w-md -scale-x-100"
          />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-xl font-semibold text-ink">What's inside</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(({ to, title, body }) => (
            <Link
              key={to}
              to={to}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <h3 className="font-display font-semibold text-brand-600">{title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{body}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
