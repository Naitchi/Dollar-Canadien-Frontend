import { useEffect, useRef, useState } from 'react';

import { SCORE_ANIMATION_MS, SCORE_BEATS_MS } from '@/constants/timings';
import { outcomeFor } from '@/functions/game';

import DieFace from '../ui/DieFace';

// Styles
import styles from './DicesResultsAnimation.module.css';

export enum step {
  none = 0, // rien
  step1 = 1, // arrivée de la carte
  step2 = 2, // arrivée des dés
  step3 = 3, // fusion des dés
  step4 = 4, // apparition du total
  step5 = 5, // verdict (attaque, pile 30, ou PV perdus)
  step6 = 6, // sortie de la carte
}

interface DicesResultsAnimation {
  dices: number[];
  // "Ton score" / "Score de Gaston".
  name?: string;
  onAnimationEnd: () => void;
}

// The score reveal, over the whole screen (fixed: visible wherever the page
// is scrolled, never adds a scrollbar). Same beats as before; the total
// duration is mirrored by the backend (constants/timings.ts).
const DicesResultsAnimation: React.FC<DicesResultsAnimation> = ({ dices, name = 'Score', onAnimationEnd }) => {
  const [animationStep, setAnimationStep] = useState<step>(step.none);

  const total = dices.reduce((sum, value) => sum + value, 0);
  const outcome = outcomeFor(total);

  // Kept in a ref so that the parent re-rendering (every Pusher update gives
  // it a new callback) doesn't restart the animation from scratch.
  const onAnimationEndRef = useRef(onAnimationEnd);
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
  });

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setAnimationStep(step.step1), SCORE_BEATS_MS.band),
      setTimeout(() => setAnimationStep(step.step2), SCORE_BEATS_MS.dice),
      setTimeout(() => setAnimationStep(step.step3), SCORE_BEATS_MS.merge),
      setTimeout(() => setAnimationStep(step.step4), SCORE_BEATS_MS.total),
      setTimeout(() => setAnimationStep(step.step5), SCORE_BEATS_MS.verdict),
      setTimeout(() => setAnimationStep(step.step6), SCORE_BEATS_MS.out),
      setTimeout(() => onAnimationEndRef.current(), SCORE_ANIMATION_MS),
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  const verdict =
    outcome.kind === 'attack'
      ? { text: `Attaque de ${outcome.attackNumber} !`, tone: styles.attack }
      : outcome.kind === 'even'
        ? { text: 'Pile-poil !', tone: styles.even }
        : { text: `Ayoye ! −${outcome.amount} PV`, tone: styles.ouch };

  return (
    <div className={`${styles.block} ${animationStep >= step.step1 ? styles.dim : ''}`} aria-hidden="true">
      {animationStep >= step.step1 && (
        <div className={`${styles.card} ${animationStep === step.step6 ? styles.slideOut : ''}`}>
          <p className={styles.name}>{name}</p>
          <div className={styles.stage}>
            {(animationStep === step.step2 || animationStep === step.step3) && (
              <div className={`${styles.dice} ${animationStep === step.step3 ? styles.merge : ''}`}>
                {dices.map((value, index) => (
                  <span key={index} className={styles.die} style={{ ['--i' as string]: index }}>
                    <DieFace value={value} size={52} />
                  </span>
                ))}
              </div>
            )}
            {animationStep >= step.step4 && (
              <div className={styles.total}>
                <span className={styles.totalValue}>{total}</span>
                <span className={styles.totalTarget}>/ 30</span>
              </div>
            )}
          </div>
          <div className={styles.verdictSlot}>
            {animationStep >= step.step5 && <p className={`${styles.verdict} ${verdict.tone}`}>{verdict.text}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DicesResultsAnimation;
