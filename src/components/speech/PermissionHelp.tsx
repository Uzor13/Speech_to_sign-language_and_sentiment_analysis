import { Banner } from '@/components/ui/Banner';
import type { RecognitionError } from '@/lib/speech/types';

export function PermissionHelp({ error }: { error: RecognitionError }) {
  const blocked = error.code === 'not-allowed' || error.code === 'service-not-allowed';

  return (
    <Banner tone={error.terminal ? 'error' : 'info'} title={blocked ? 'Microphone blocked' : undefined}>
      <p>{error.message}</p>
      {blocked && (
        <p className="mt-1 text-xs">
          In Chrome, click the icon at the left of the address bar, set Microphone to Allow, then
          reload the page.
        </p>
      )}
    </Banner>
  );
}
