import Head from 'next/head';
import { useState } from 'react';

// Styles
import styles from '../styles/test.module.css';

import DicesResultsAnimation from '@/components/DicesResultsAnimation/DicesResultsAnimation';
import Button from '@/components/ui/Button';

// Page de teste pour designer/tester des composants en dehors des autres pour être plus éfficace
export default function TestPage() {
  const dices = [4, 4, 6, 6, 5, 6];
  // Changing the key replays the animation.
  const [run, setRun] = useState(0);

  return (
    <div className={styles.testPage}>
      <Head>
        <title>Bac à sable · Dollar Canadien</title>
      </Head>
      <h1 className={styles.title}>Bac à sable : révélation du score</h1>
      <Button variant="primary" icon="refresh" onClick={() => setRun((count) => count + 1)}>
        Rejouer l&apos;animation
      </Button>
      <DicesResultsAnimation key={run} dices={dices} name="Score de test" onAnimationEnd={() => {}} />
    </div>
  );
}
