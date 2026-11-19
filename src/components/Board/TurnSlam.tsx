import { useEffect, useState } from 'react';

import styles from './Board.module.css';

// The sticker only lasts this long; the lasting signal is the yellow turn card.
const SLAM_MS = 1100;

// "C'EST À TOI !" slammed on screen when our turn starts. Purely visual:
// never captures a click, never moves the focus (the announcement is made
// by the board).
const TurnSlam = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(false), SLAM_MS);
    return () => clearTimeout(timeout);
  }, []);

  if (!visible) return null;
  return (
    <div className={styles.slamLayer} aria-hidden="true">
      <p className={styles.slam}>C&apos;est à toi !</p>
    </div>
  );
};

export default TurnSlam;
