// Functions
import { beatDuration } from '@/functions/functions';

// Styles
import styles from './Heart.module.css';

interface HeartProps {
  hp: number;
  maxHp: number;
}

const Heart: React.FC<HeartProps> = ({ hp, maxHp }) =>
  hp > 0 ? (
    <span
      className={styles.heart}
      style={{ animationDuration: `${beatDuration(hp, maxHp)}s` }}
      aria-hidden="true"
    >
      ❤
    </span>
  ) : (
    <span className={styles.broken} aria-hidden="true">
      💔
    </span>
  );

export default Heart;
