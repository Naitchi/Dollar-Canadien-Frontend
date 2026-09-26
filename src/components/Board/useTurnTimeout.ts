import { useEffect } from 'react';

// Services
import { turnTimeout } from '@/services/services';

// Types
import { User } from '@/types/gameType';

// Once the server's deadline for the current step has passed, wait this much
// more before asking it to unblock the turn, then ask again every
// TIMEOUT_RETRY_MS until the game moves on (our clock may be a bit ahead of
// the server's, which then answers "not yet").
const TIMEOUT_GRACE_MS = 1000;
const TIMEOUT_RETRY_MS = 5000;

interface TurnTimeoutParams {
  id: string | undefined;
  user: User | null;
  // Only the players (not spectators) can unblock a turn.
  isPlayer: boolean;
  turnDeadline: string | null | undefined;
  // Server clock minus ours, in milliseconds.
  clockOffset: number;
}

/**
 * If the active player goes AFK or closes their tab, nobody else could make
 * the game move on. Every player's client asks the server to unblock the
 * turn once its deadline has passed; the server checks the deadline itself
 * and only lets one of these requests through.
 */
export const useTurnTimeout = ({
  id,
  user,
  isPlayer,
  turnDeadline,
  clockOffset,
}: TurnTimeoutParams): void => {
  useEffect(() => {
    if (!id || !user || !isPlayer || !turnDeadline) return;

    let retry: ReturnType<typeof setInterval> | undefined;
    const serverNow = Date.now() + clockOffset;
    const delay = Math.max(new Date(turnDeadline).getTime() - serverNow, 0) + TIMEOUT_GRACE_MS;
    const timeout = setTimeout(() => {
      turnTimeout(user, id);
      retry = setInterval(() => turnTimeout(user, id), TIMEOUT_RETRY_MS);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearInterval(retry);
    };
  }, [id, user, isPlayer, turnDeadline, clockOffset]);
};
