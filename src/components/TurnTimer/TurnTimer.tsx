import { useEffect, useRef, useState } from 'react';

// Functions
import { secondsLeft } from '@/functions/functions';

import { useAnnounce } from '../Announcer/Announcer';

// Styles
import styles from './TurnTimer.module.css';

// Under this many seconds left, the timer turns red to hurry the player up.
const URGENT_SECONDS = 10;

/**
 * Whole seconds left before a server deadline, updated 4 times a second
 * (null without a deadline).
 */
export const useSecondsLeft = (deadline: string | null | undefined, clockOffset: number): number | null => {
  const [remaining, setRemaining] = useState<number | null>(() =>
    deadline ? secondsLeft(deadline, clockOffset) : null,
  );
  useEffect(() => {
    if (!deadline) {
      setRemaining(null);
      return;
    }
    setRemaining(secondsLeft(deadline, clockOffset));
    const interval = setInterval(() => setRemaining(secondsLeft(deadline, clockOffset)), 250);
    return () => clearInterval(interval);
  }, [deadline, clockOffset]);
  return remaining;
};

interface TurnTimerProps {
  deadline: string;
  clockOffset: number;
  isMyTurn: boolean;
  username: string;
}

// Time left to the active player before the other players can unblock
// their turn (their remaining dice then get locked for them, see turnTimeout).
// The reference's yellow disc. Announced only at 10 s and 0 s on our own
// turn, never every second.
const TurnTimer: React.FC<TurnTimerProps> = ({ deadline, clockOffset, isMyTurn, username }) => {
  const announce = useAnnounce();
  // Ticks faster than once a second so the display never skips a second.
  const remaining = useSecondsLeft(deadline, clockOffset) ?? 0;
  const announced = useRef<{ deadline: string; urgent: boolean; over: boolean }>({ deadline, urgent: false, over: false });

  useEffect(() => {
    if (announced.current.deadline !== deadline) {
      announced.current = { deadline, urgent: false, over: false };
    }
    if (!isMyTurn) return;
    if (remaining === 0 && !announced.current.over) {
      announced.current.over = true;
      announce('Temps écoulé : tes dés restants vont être gardés automatiquement.', 'assertive');
    } else if (remaining > 0 && remaining <= URGENT_SECONDS && !announced.current.urgent) {
      announced.current.urgent = true;
      announce(`Plus que ${remaining} secondes.`, 'assertive');
    }
  }, [remaining, isMyTurn, deadline, announce]);

  const urgent = remaining <= URGENT_SECONDS;
  const sentence =
    remaining === 0
      ? isMyTurn
        ? 'Temps écoulé : tes dés restants vont être gardés'
        : 'Temps écoulé'
      : isMyTurn
        ? `Il te reste ${remaining} secondes`
        : `${username} a encore ${remaining} secondes`;

  return (
    <div className={`${styles.disc} ${urgent ? styles.urgent : ''}`} role="timer" title={sentence}>
      <span className={styles.label} aria-hidden="true">
        {urgent ? (remaining === 0 ? 'Fini' : 'Vite !') : 'Sec'}
      </span>
      <span className={styles.value} aria-hidden="true">
        {remaining}
      </span>
      <span className="sr-only">{sentence}</span>
    </div>
  );
};

export default TurnTimer;
