import React from 'react';
import { decodePassphrase } from './client-utils';

export function useSetupE2EE() {
  const e2eePassphrase = React.useMemo(
    () =>
      typeof window !== 'undefined' ? decodePassphrase(location.hash.substring(1)) : undefined,
    [],
  );

  const worker = React.useMemo(
    () =>
      typeof window !== 'undefined' && e2eePassphrase
        ? new Worker(new URL('livekit-client/e2ee-worker', import.meta.url))
        : undefined,
    [e2eePassphrase],
  );

  React.useEffect(() => () => worker?.terminate(), [worker]);

  return { worker, e2eePassphrase };
}
