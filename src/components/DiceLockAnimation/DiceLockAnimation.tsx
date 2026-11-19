import React from 'react';

import Icon from '../ui/Icon';
import styles from './DiceLockAnimation.module.css';

interface DiceLockAnimationProps {
  show: boolean;
}

// A padlock stamped on each die being kept, during the lock delay (the dice
// only move to the tray once the server confirms).
const DiceLockAnimation: React.FC<DiceLockAnimationProps> = ({ show }) => {
  if (!show) return null;

  return (
    <span className={styles.overlay} aria-hidden="true">
      <span className={styles.stamp}>
        <Icon name="lock" size={18} strokeWidth={3} />
      </span>
    </span>
  );
};

export default DiceLockAnimation;
