import dynamic from 'next/dynamic';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

// Styles
import styles from './AttackAnimation.module.css';

// Each pre-computed reroll of the attack sequence is thrown in 3D (about
// 1.8 s at most, see createThrow in Dices3D/diceMath.ts), then the dice
// hitting the attack number stay highlighted until the next one. After the
// last one, the damage badge is shown for FINAL_BADGE_DELAY_MS.
// Mirrored by ATTACK_ROUND_MS / ATTACK_BADGE_MS in the backend
// (functions/turn.js): keep them in sync.
const ROUND_DELAY_MS = 2800;
const FINAL_BADGE_DELAY_MS = 2000;

// Same chunk as the one Board loads: three.js is only downloaded once.
const Dices3D = dynamic(() => import('../Dices3D/Dices3D'), { ssr: false });

const NO_SELECTION: number[] = [];

interface AttackAnimationProps {
  attackDices: number[][];
  attackNumber: number;
  // The damage badge pops up: the HP of the targets can be shown.
  onHit?: () => void;
  onAnimationEnd: () => void;
  // The dice row of the box the rerolls are thrown in (see Board.tsx).
  rowRef: RefObject<HTMLDivElement>;
}

// Renders in the same spot as the normal dice: each reroll is thrown like
// them, the dice matching the attack number rise and glow once landed, then
// a compact damage badge once every reroll has been shown.
const AttackAnimation: React.FC<AttackAnimationProps> = ({
  attackDices,
  attackNumber,
  onHit,
  onAnimationEnd,
  rowRef,
}) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const isLastRound = roundIndex >= attackDices.length;

  const totalDamage =
    attackDices.reduce((sum, roll) => sum + roll.filter((value) => value === attackNumber).length, 0) *
    attackNumber;

  const currentRoll = isLastRound ? null : attackDices[roundIndex];
  const hits = useMemo(
    () =>
      (currentRoll ?? []).flatMap((value, index) => (value === attackNumber ? [index] : [])),
    [currentRoll, attackNumber],
  );

  // Kept in a ref so that the parent re-rendering (every Pusher update gives
  // it a new callback) doesn't restart the current round's timer.
  const onAnimationEndRef = useRef(onAnimationEnd);
  const onHitRef = useRef(onHit);
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
    onHitRef.current = onHit;
  });

  useEffect(() => {
    if (isLastRound) onHitRef.current?.();
  }, [isLastRound]);

  useEffect(() => {
    const delay = isLastRound ? FINAL_BADGE_DELAY_MS : ROUND_DELAY_MS;
    const timeout = setTimeout(() => {
      if (isLastRound) {
        onAnimationEndRef.current();
      } else {
        setRoundIndex((index) => index + 1);
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [roundIndex, isLastRound]);

  if (!currentRoll) {
    return <div className={styles.damageBadge}>-{totalDamage} 💥</div>;
  }

  return (
    <Dices3D
      dices={currentRoll}
      hits={hits}
      throwKey={roundIndex}
      selected={NO_SELECTION}
      locking={false}
      interactive={false}
      rowRef={rowRef}
    />
  );
};

export default AttackAnimation;
