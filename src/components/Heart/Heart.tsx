// Functions
import { beatDuration } from '@/functions/functions';

// Styles
import styles from './Heart.module.css';

// A looping animation must stop within 5 s (WCAG 2.2.2): the heart beats for
// about that long, and starts again whenever the HP change (new `key`).
const BEATING_FOR_S = 5;

interface HeartProps {
  hp: number;
  maxHp: number;
  // Only my heart and the hearts of players in danger beat: if every heart
  // beat, it would mean nothing.
  beating?: boolean;
  size?: number;
}

const Heart: React.FC<HeartProps> = ({ hp, maxHp, beating = false, size = 16 }) => {
  if (hp <= 0) {
    return (
      <span className={styles.broken} aria-hidden="true">
        💔
      </span>
    );
  }
  const duration = beatDuration(hp, maxHp);
  return (
    <svg
      key={hp}
      className={`${styles.heart} ${beating ? styles.beating : ''}`}
      style={
        beating
          ? {
              animationDuration: `${duration}s`,
              animationIterationCount: Math.max(1, Math.round(BEATING_FOR_S / duration)),
            }
          : undefined
      }
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 21s-8.5-5.2-8.5-11.4A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 8.5 2.8C20.5 15.8 12 21 12 21z"
        fill="#e11d48"
        stroke="#111e2e"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Heart;
