import dynamic from 'next/dynamic';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { ATTACK_BADGE_MS, ATTACK_ROUND_MS } from '@/constants/timings';

// Styles
import styles from './AttackAnimation.module.css';

// Each pre-computed reroll of the attack sequence is thrown in 3D (about
// 1.8 s at most, see createThrow in Dices3D/diceMath.ts), then the dice
// hitting the attack number stay highlighted until the next one. After the
// last one, the damage badge is shown for ATTACK_BADGE_MS.
// Mirrored by ATTACK_ROUND_MS / ATTACK_BADGE_MS in the backend
// (functions/turn.js): see constants/timings.ts.

// Same chunk as the one Board loads: three.js is only downloaded once.
const Dices3D = dynamic(() => import('../Dices3D/Dices3D'), { ssr: false });

const NO_SELECTION: number[] = [];

export interface AttackProgress {
  // 1-based reroll being shown, out of `rounds`.
  round: number;
  rounds: number;
  // Hits so far (including this reroll) and the damage they make.
  hits: number;
  damage: number;
}

interface AttackAnimationProps {
  attackDices: number[][];
  attackNumber: number;
  // The damage badge pops up: the HP of the targets can be shown.
  onHit?: () => void;
  // Each reroll shown (for the running counter next to the mat).
  onProgress?: (progress: AttackProgress) => void;
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
  onProgress,
  onAnimationEnd,
  rowRef,
}) => {
  const [roundIndex, setRoundIndex] = useState(0);
  const isLastRound = roundIndex >= attackDices.length;

  const hitsPerRound = attackDices.map((roll) => roll.filter((value) => value === attackNumber).length);
  const totalDamage = hitsPerRound.reduce((sum, count) => sum + count, 0) * attackNumber;

  const currentRoll = isLastRound ? null : attackDices[roundIndex];
  const hits = useMemo(
    () => (currentRoll ?? []).flatMap((value, index) => (value === attackNumber ? [index] : [])),
    [currentRoll, attackNumber],
  );

  // Kept in refs so that the parent re-rendering (every Pusher update gives
  // it new callbacks) doesn't restart the current round's timer.
  const onAnimationEndRef = useRef(onAnimationEnd);
  const onHitRef = useRef(onHit);
  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
    onHitRef.current = onHit;
    onProgressRef.current = onProgress;
  });

  useEffect(() => {
    if (isLastRound) {
      onHitRef.current?.();
      return;
    }
    const hitsSoFar = hitsPerRound.slice(0, roundIndex + 1).reduce((sum, count) => sum + count, 0);
    onProgressRef.current?.({
      round: roundIndex + 1,
      rounds: attackDices.length,
      hits: hitsSoFar,
      damage: hitsSoFar * attackNumber,
    });
    // Only when the round changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex, isLastRound]);

  useEffect(() => {
    const delay = isLastRound ? ATTACK_BADGE_MS : ATTACK_ROUND_MS;
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
    return (
      <div className={styles.final}>
        <span className={styles.damageBadge}>
          <span aria-hidden="true">💥</span> −{totalDamage}
        </span>
        <span className={styles.caption}>
          {totalDamage === 0 ? 'Raté, aucun dégât !' : `${totalDamage / attackNumber} × ${attackNumber} dégâts`}
        </span>
      </div>
    );
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
