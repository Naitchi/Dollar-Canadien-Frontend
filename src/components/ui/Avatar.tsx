import { Avatar as AvatarData } from '@/functions/game';

import styles from './Avatar.module.css';

interface AvatarProps {
  avatar: AvatarData;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  // Eliminated: greyed out with a skull.
  dead?: boolean;
  className?: string;
}

// Animal on a coloured tile (the reference's avatar tiles). Decorative: the
// player's name is always shown next to it.
const Avatar = ({ avatar, size = 'md', dead = false, className }: AvatarProps) => (
  <span
    className={`${styles.avatar} ${styles[size]} ${dead ? styles.dead : ''} ${className ?? ''}`}
    style={{ backgroundColor: dead ? undefined : avatar.tile }}
    aria-hidden="true"
  >
    <span className={styles.animal}>{dead ? '💀' : avatar.animal}</span>
  </span>
);

export default Avatar;
