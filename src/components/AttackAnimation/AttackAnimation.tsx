import { useEffect, useState } from 'react';

// Styles
import styles from './AttackAnimation.module.css';

// Each pre-computed reroll of the attack sequence is shown for this long
// before moving on to the next one (or to the final damage badge).
const ROUND_DELAY_MS = 2000;
const FINAL_BADGE_DELAY_MS = 2000;

interface AttackAnimationProps {
  attackDices: number[][];
  attackNumber: number;
  onAnimationEnd: () => void;
}

// Renders inline in the same spot the normal dice occupy (see Board.tsx's
// dicesLaunched box) - no full-screen takeover, just the dice for the
// current reroll (dice matching the attack number lift themselves after a
// beat), then a compact damage badge once every reroll has been shown.
const AttackAnimation: React.FC<AttackAnimationProps> = ({
  attackDices,
  attackNumber,
  onAnimationEnd,
}) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const isLastRound = roundIndex >= attackDices.length;

  const totalDamage =
    attackDices.reduce((sum, roll) => sum + roll.filter((value) => value === attackNumber).length, 0) *
    attackNumber;

  useEffect(() => {
    const delay = isLastRound ? FINAL_BADGE_DELAY_MS : ROUND_DELAY_MS;
    const timeout = setTimeout(() => {
      if (isLastRound) {
        onAnimationEnd();
      } else {
        setRoundIndex((index) => index + 1);
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [roundIndex, isLastRound, onAnimationEnd]);

  if (isLastRound) {
    return <div className={styles.damageBadge}>-{totalDamage} 💥</div>;
  }

  const currentRoll = attackDices[roundIndex];

  return (
    <>
      {currentRoll.map((value, index) => (
        <div
          key={`${roundIndex}-${index}`}
          className={`${styles.dice} ${value === attackNumber ? styles.hit : ''}`}
        >
          {value}
        </div>
      ))}
    </>
  );
};

export default AttackAnimation;
