// Styles
import styles from '../styles/test.module.css';

import DicesResultsAnimation from '@/components/DicesResultsAnimation/DicesResultsAnimation';

// Page de teste pour designer/tester des composants en dehors des autres pour être plus éfficace
export default function TestPage() {
  const dices = [4, 4, 6, 6, 5, 6];

  return (
    <div className={styles.testPage}>
      <DicesResultsAnimation dices={dices} onAnimationEnd={() => {}} />
    </div>
  );
}
