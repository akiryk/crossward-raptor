'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000;

export function SessionRenewal() {
  // Better Auth checks on mount and when a tab becomes visible. With deferred
  // refresh, its session observer follows a due GET with a cookie-writing POST.
  const { refetch } = authClient.useSession();
  const pathname = usePathname();
  const lastCheckedAt = useRef<number | null>(null);

  useEffect(() => {
    function checkSession() {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (
        lastCheckedAt.current !== null &&
        now - lastCheckedAt.current < ACTIVITY_CHECK_INTERVAL_MS
      ) return;
      lastCheckedAt.current = now;
      void refetch();
    }

    // The hook already fetches on mount. Subsequent route changes and input
    // cover activity in a persistent layout or an editor left open for days.
    if (lastCheckedAt.current === null) lastCheckedAt.current = Date.now();
    else checkSession();

    document.addEventListener('keydown', checkSession, { capture: true, passive: true });
    document.addEventListener('pointerdown', checkSession, { capture: true, passive: true });
    return () => {
      document.removeEventListener('keydown', checkSession, true);
      document.removeEventListener('pointerdown', checkSession, true);
    };
  }, [pathname, refetch]);

  return null;
}
