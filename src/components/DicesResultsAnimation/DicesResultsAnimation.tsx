import { useEffect, useRef, useState } from 'react';

// Styles
import styles from './DicesResultsAnimation.module.css';

export enum step {
  none = 0, // rien
  step1 = 1, // slide du bandeau rouge
  step2 = 2, // arrive des nombres
  step3 = 3, // fusions des nombres
  step4 = 4, // apparition du resultat
  step5 = 5, // apparition dune courrone si positif ou une goutte genre sueur qui degouline dans le cas contraire
  step6 = 6, // slide du bandeau rouge
}

// TODO recuperer les des du joueur actif via le store dans le composant (pas important pour l'instant (en vrai un peu vu que la c'est degueux dans board))
// TODO remplacer les nombres par des vrais des (three.js si possible)
// TODO adapter le composant pour qu'on puisse les utiliser dans les resultats d'attaque aussi

interface DicesResultsAnimation {
  dices: number[];
  onAnimationEnd: () => void;
}

const DicesResultsAnimation: React.FC<DicesResultsAnimation> = ({ dices, onAnimationEnd }) => {
  const [animationStep, setAnimationStep] = useState<step>(step.none);

  const total = dices[0] + dices[1] + dices[2] + dices[3] + dices[4] + dices[5];

  // Kept in a ref so that the parent re-rendering (every Pusher update gives
  // it a new callback) doesn't restart the animation from scratch.
  const onAnimationEndRef = useRef(onAnimationEnd);
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
  });

  // The total duration (last timeout) is mirrored by SCORE_ANIMATION_MS in
  // the backend (functions/turn.js): keep them in sync.
  useEffect(() => {
    const timeouts = [
      setTimeout(() => setAnimationStep(step.step1), 500),
      setTimeout(() => setAnimationStep(step.step2), 2000),
      setTimeout(() => setAnimationStep(step.step3), 3000),
      setTimeout(() => setAnimationStep(step.step4), 3700),
      setTimeout(() => setAnimationStep(step.step5), 4000),
      setTimeout(() => setAnimationStep(step.step6), 5000),
      setTimeout(() => onAnimationEndRef.current(), 6000),
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={styles.block}>
      {animationStep >= step.step1 && (
        <div
          className={`${styles.redRectangle} 
            ${animationStep === step.step6 ? styles.slideOut : ''}`}
        >
          {animationStep >= step.step4 && <div className={`${styles.bounce}`}>{total}</div>}
          {animationStep >= step.step5 && total < 30 && <div className={`${styles.drop}`}>💧</div>}
          {animationStep >= step.step5 && total >= 30 && (
            <div className={`${styles.crown}`}>
              👑
              {/* TODO ameliorer avec plus de mouvements a l'aterrisage 
              idee : la faire tomber droite mais elle atterie sur le cote du coup elle fini penche + pas centrer atm responsive */}
            </div>
          )}
        </div>
      )}
      {(animationStep == step.step2 || animationStep == step.step3) && (
        <div className={`${styles.text}`}>
          {dices.map((data, index) => (
            <p
              className={` ${styles.number} ${animationStep >= step.step3 ? styles.test : ''}`}
              key={index}
            >
              {data}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

export default DicesResultsAnimation;
