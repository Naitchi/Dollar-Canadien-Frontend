import { useEffect, useRef } from 'react';

import { useAnnounce } from '../Announcer/Announcer';
import styles from './DeathOverlay.module.css';

// Short enough never to matter (the eliminated player has nothing left to
// do), long enough to feel it.
const DURATION_MS = 2000;

interface DeathOverlayProps {
  onDone: () => void;
}

// The owner's wish: an Undertale-style heart break, only for the player who
// just died. Never blocks anything (no clicks captured, no focus moved).
const DeathOverlay = ({ onDone }: DeathOverlayProps) => {
  const announce = useAnnounce();
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    announce('Tu es K.O. Tu peux continuer à regarder la partie et à discuter.', 'assertive');
    const timeout = setTimeout(() => onDoneRef.current(), DURATION_MS);
    return () => clearTimeout(timeout);
  }, [announce]);

  return (
    <div className={styles.overlay} aria-hidden="true">
      <div className={styles.heart}>
        <svg className={styles.half} viewBox="0 0 24 24" width="120" height="120">
          <path d="M12 21s-8.5-5.2-8.5-11.4A4.8 4.8 0 0 1 12 6.8l-1.5 3 2.5 2.5-2 3 1 5.7z" fill="#e11d48" stroke="#111e2e" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        <svg className={`${styles.half} ${styles.right}`} viewBox="0 0 24 24" width="120" height="120">
          <path d="M12 21s8.5-5.2 8.5-11.4A4.8 4.8 0 0 0 12 6.8l-1.5 3 2.5 2.5-2 3 1 5.7z" fill="#e11d48" stroke="#111e2e" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className={styles.shard} style={{ ['--i' as string]: index }} />
        ))}
      </div>
      <p className={styles.text}>
        T&apos;es K.O. !<span>Reste déterminé… en spectateur.</span>
      </p>
    </div>
  );
};

export default DeathOverlay;
