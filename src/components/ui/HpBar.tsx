import { hpRatio } from '@/functions/game';

import styles from './HpBar.module.css';

interface HpBarProps {
  hp: number;
  maxHp: number;
  danger?: boolean;
  className?: string;
}

// Share of the starting HP left (any maxHp from 1 to 999). Decorative: the
// exact "22 PV" is always written next to it. Never empty while alive.
const HpBar = ({ hp, maxHp, danger = false, className }: HpBarProps) => {
  const ratio = hpRatio(hp, maxHp);
  const width = hp > 0 ? Math.max(ratio * 100, 4) : 0;
  return (
    <span className={`${styles.track} ${className ?? ''}`} aria-hidden="true">
      <span className={`${styles.fill} ${danger ? styles.danger : ''}`} style={{ width: `${width}%` }} />
    </span>
  );
};

export default HpBar;
