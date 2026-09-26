import { useEffect, useState } from 'react';

// Functions
import { secondsLeft } from '@/functions/functions';

// Styles
import styles from './TurnTimer.module.css';

// Under this many seconds left, the timer turns red to hurry the player up.
const URGENT_SECONDS = 10;

interface TurnTimerProps {
  deadline: string;
  clockOffset: number;
  isMyTurn: boolean;
  username: string;
}

// Time left to the active player before the other players can unblock
// their turn (their remaining dice then get locked for them, see turnTimeout).
const TurnTimer: React.FC<TurnTimerProps> = ({ deadline, clockOffset, isMyTurn, username }) => {
  const [remaining, setRemaining] = useState(() => secondsLeft(deadline, clockOffset));

  useEffect(() => {
    setRemaining(secondsLeft(deadline, clockOffset));
    // Ticks faster than once a second so the display never skips a second.
    const interval = setInterval(() => setRemaining(secondsLeft(deadline, clockOffset)), 250);
    return () => clearInterval(interval);
  }, [deadline, clockOffset]);

  const message =
    remaining === 0
      ? isMyTurn
        ? 'Temps écoulé : tes dés restants vont être verrouillés'
        : 'Temps écoulé !'
      : isMyTurn
        ? `Il te reste ${remaining} s`
        : `${username} a encore ${remaining} s`;

  return (
    <p
      className={`${styles.timer} ${remaining <= URGENT_SECONDS ? styles.urgent : ''}`}
      role="timer"
    >
      ⏱ {message}
    </p>
  );
};

export default TurnTimer;
