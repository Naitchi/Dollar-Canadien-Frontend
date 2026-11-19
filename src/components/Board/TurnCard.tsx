import { Ref } from 'react';

import { step } from '@/types/gameType';

import TurnTimer from '../TurnTimer/TurnTimer';
import Icon from '../ui/Icon';
import styles from './Board.module.css';

interface TurnCardProps {
  activeName: string;
  isMyTurn: boolean;
  currentStep: step | undefined;
  inResult: boolean;
  lockedCount: number;
  // Who plays next ("toi" when it's us), null when unknown or the game is ending.
  nextName: string | null;
  deadline: string | null | undefined;
  showTimer: boolean;
  clockOffset: number;
  headingRef: Ref<HTMLHeadingElement>;
}

// The reference's "Tour actuel" card. While it's our turn it stays yellow
// the whole time: visible from across the table.
const TurnCard = ({
  activeName,
  isMyTurn,
  currentStep,
  inResult,
  lockedCount,
  nextName,
  deadline,
  showTimer,
  clockOffset,
  headingRef,
}: TurnCardProps) => {
  const label = inResult ? 'Résultat du tour' : isMyTurn ? 'À toi de jouer' : 'Tour actuel';
  const sub = inResult
    ? null
    : isMyTurn
      ? currentStep === step.dices
        ? 'Choisis les dés à garder.'
        : currentStep === step.lockAnimation
          ? 'On garde tes dés…'
          : lockedCount === 0
            ? 'Lance tes 6 dés !'
            : 'Relance les dés restants.'
      : currentStep === step.dices
        ? 'choisit ses dés…'
        : currentStep === step.lockAnimation
          ? 'garde ses dés…'
          : 'va lancer…';

  return (
    <section className={`${styles.turnCard} ${isMyTurn && !inResult ? styles.turnMine : ''}`} aria-label="Tour actuel">
      <span className={styles.turnIcon} aria-hidden="true">
        <Icon name={inResult ? 'target' : 'dice'} size={26} />
      </span>
      <div className={styles.turnText}>
        <p className={styles.turnLabel}>{label}</p>
        <h1 className={styles.turnTitle} ref={headingRef} tabIndex={-1}>
          {inResult ? (
            isMyTurn ? (
              'Ton tour'
            ) : (
              <>
                Tour de <span className={styles.turnName}>{activeName}</span>
              </>
            )
          ) : isMyTurn ? (
            "C'est à toi !"
          ) : (
            <>
              <span className={styles.turnName}>{activeName}</span> joue
            </>
          )}
        </h1>
        {(sub || nextName) && (
          <p className={styles.turnSub}>
            {sub && !isMyTurn ? `${activeName} ${sub}` : sub}
            {nextName && (
              <>
                {sub && <span className={styles.turnSep}> · </span>}
                <span className={styles.turnNext}>
                  Ensuite : <strong>{nextName}</strong>
                </span>
              </>
            )}
          </p>
        )}
      </div>
      <div className={styles.turnStats}>
        <div className={styles.keptBox}>
          <span className={styles.keptLabel}>Gardés</span>
          <span className={styles.keptValue}>
            {lockedCount}
            <span className={styles.keptMax}> / 6</span>
          </span>
        </div>
        {showTimer && deadline && (
          <TurnTimer deadline={deadline} clockOffset={clockOffset} isMyTurn={isMyTurn} username={activeName} />
        )}
      </div>
    </section>
  );
};

export default TurnCard;
