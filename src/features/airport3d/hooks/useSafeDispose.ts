import { useEffect, useRef } from 'react';

export function useSafeDispose(resource: { dispose: () => void }) {
  const pending = useRef<{ resource: typeof resource; timer: number } | null>(null);
  useEffect(() => {
    if (pending.current?.resource === resource) {
      window.clearTimeout(pending.current.timer);
      pending.current = null;
    }
    return () => {
      const timer = window.setTimeout(() => {
        resource.dispose();
        if (pending.current?.timer === timer) pending.current = null;
      }, 0);
      pending.current = { resource, timer };
    };
  }, [resource]);
}

