import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';

interface TranscriptInputProps {
  onSubmit: (text: string) => void;
  label?: string;
}

/** The typing fallback, used wherever a microphone is unavailable. */
export function TranscriptInput({ onSubmit, label = 'Type instead' }: TranscriptInputProps) {
  const [draft, setDraft] = useState('');

  return (
    <div className="flex flex-col gap-2">
      <TextArea
        label={label}
        rows={3}
        value={draft}
        placeholder="Type what you would have said…"
        onChange={(e) => setDraft(e.target.value)}
      />
      <div>
        <Button size="sm" onClick={() => onSubmit(draft)} disabled={!draft.trim()}>
          Use this text
        </Button>
      </div>
    </div>
  );
}
