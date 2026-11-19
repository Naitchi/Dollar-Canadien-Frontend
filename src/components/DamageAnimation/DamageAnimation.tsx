import { useEffect, useRef, useState } from 'react';

import { DAMAGE_ANIMATION_MS, DAMAGE_BADGE_DELAY_MS } from '@/constants/timings';

// Components
import Heart from '../Heart/Heart';

// Styles
import styles from './DamageAnimation.module.css';

interface DamageAnimationProps {
  // Sum of the 6 locked dice, below 30.
  score: number;
  // The damage badge pops up: the HP loss can be shown.
  onHit?: () => void;
  onAnimationEnd: () => void;
}

// Shown in place of the dice when the locked dice add up to less than 30
// (like AttackAnimation above 30): the score against the 30 to reach, then
// the HP it costs. Durations mirrored by the backend (constants/timings.ts).
const DamageAnimation: React.FC<DamageAnimationProps> = ({ score, onHit, onAnimationEnd }) => {
  const [showBadge, setShowBadge] = useState(false);

  // Kept in a ref so that the parent re-rendering (every Pusher update gives
  // it a new callback) doesn't restart the animation.
  const onAnimationEndRef = useRef(onAnimationEnd);
  const onHitRef = useRef(onHit);
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
    onHitRef.current = onHit;
  });

  useEffect(() => {
    const timeouts = [
      setTimeout(() => {
        setShowBadge(true);
        onHitRef.current?.();
      }, DAMAGE_BADGE_DELAY_MS),
      setTimeout(() => onAnimationEndRef.current(), DAMAGE_ANIMATION_MS),
    ];
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className={styles.damage}>
      <p className={styles.score}>
        <span className={styles.total}>{score}</span>
        <span className={styles.target}> / 30</span>
      </p>
      {showBadge && (
        <div className={styles.badge}>
          <Heart hp={1} maxHp={30} size={24} />−{30 - score} PV
        </div>
      )}
    </div>
  );
};

export default DamageAnimation;
