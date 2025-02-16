import { useEffect, useState } from 'react';

// Styles
import styles from '../styles/test.module.css';

// TODO rename en leur fonction et enlever le step (vu qu'on va l'utiliser en mode step.Rectancle par exemple) ça serai cool si c'était dans l'ordre donc pourquoi pas commencé par un chiffre
export enum step {
  none = 0,
  step1 = 1,
  step2 = 2,
  step3 = 3,
  step4 = 4,
  step5 = 5,
  step6 = 6,
}

// Page de teste pour designer/tester des composants en dehors des autres pour être plus éfficace
export default function TestPage() {
  const dices = [4, 4, 3, 6, 5, 6];
  const [animationStep, setAnimationStep] = useState<step>(step.none);

  useEffect(() => {
    // TODO revoir les timers
    const timeouts = [
      setTimeout(() => setAnimationStep(step.step1), 500),
      setTimeout(() => setAnimationStep(step.step2), 2000),
      setTimeout(() => setAnimationStep(step.step3), 3000),
      setTimeout(() => setAnimationStep(step.step4), 5000),
      setTimeout(() => setAnimationStep(step.step5), 4500),
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className={styles.testPage}>
      {animationStep >= step.step1 && <div className={styles.redRectangle}></div>}
      {animationStep >= step.step2 && (
        <div className={`${styles.text} ${animationStep >= step.step3 ? styles.test : ''}`}>
          {dices.map((data, index) => (
            <p key={index}>{data}</p>
          ))}
        </div>
      )}
    </div>
  );
}
