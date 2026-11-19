import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

interface WakeLockNavigator {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

/**
 * Keeps the screen on while `active` (a game is running): a phone that goes
 * to sleep on the table misses the realtime events, and with them its turn.
 * Released when inactive or hidden, re-acquired when the tab comes back.
 * Silently does nothing where unsupported or refused.
 */
export const useWakeLock = (active: boolean): void => {
  useEffect(() => {
    const wakeLock = (navigator as Navigator & WakeLockNavigator).wakeLock;
    if (!active || !wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = () => {
      if (document.visibilityState !== 'visible') return;
      wakeLock
        .request('screen')
        .then((lock) => {
          if (cancelled) lock.release().catch(() => {});
          else sentinel = lock;
        })
        .catch(() => {});
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
};
