import React from 'react';

import styles from './DiceLockAnimation.module.css';

interface DiceLockAnimationProps {
  show: boolean;
}

const DiceLockAnimation: React.FC<DiceLockAnimationProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <span className={styles.lockEmoji}>🔒</span>
    </div>
  );
};

export default DiceLockAnimation;
