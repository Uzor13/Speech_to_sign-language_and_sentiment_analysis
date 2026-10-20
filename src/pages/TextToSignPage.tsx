import { useState } from 'react';

import { PageHeading } from '@/components/layout/PageHeading';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import { SignPipeline } from '@/components/signs/SignPipeline';
import { useTranscript } from '@/state/TranscriptContext';

const EXAMPLES = [
  'I am going to the store tomorrow',
  'My father is not here',
  'Where are you going?',
  'My name is Peter',
];

export default function TextToSignPage() {
  const { text, setText } = useTranscript();
  const [draft, setDraft] = useState(text);
  const [topicComment, setTopicComment] = useState(false);

  const submit = (value: string) => {
    setDraft(value);
    setText(value, 'typed');
  };

  return (
    <div>
      <PageHeading
        title="Text to Sign Language"
        lead="Type English and watch it translated into gloss and signed. Works in every browser, with or without a microphone."
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <TextArea
            label="English text"
            rows={4}
            value={draft}
            placeholder="Type a sentence…"
            onChange={(e) => setDraft(e.target.value)}
            hint="Press Translate, or pick an example below."
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => submit(draft)} disabled={!draft.trim()}>
              Translate
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDraft('');
                setText('', 'typed');
              }}
            >
              Clear
            </Button>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide text-ink-soft uppercase">
              Examples
            </p>
            <ul className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <li key={example}>
                  <button
                    type="button"
                    onClick={() => submit(example)}
                    className="rounded-full bg-white px-3 py-1 text-sm text-ink-soft ring-1 ring-black/10 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <label className="flex items-start gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={topicComment}
              onChange={(e) => setTopicComment(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              Topic-comment word order
              <span className="block text-xs text-slate-400">
                Fronts the object, as ASL often does ("APPLE ME LIKE"). Off by default: the rule
                only holds for simple sentences.
              </span>
            </span>
          </label>
        </div>

        <SignPipeline text={text} topicComment={topicComment} />
      </div>
    </div>
  );
}
