import React from 'react';

import styles from './DiceLockAnimation.module.css';

interface DiceLockAnimationProps {
  show: boolean;
}

// TODO refaire l'animation pour que le U inverse se lock et pas juste un emoji

const DiceLockAnimation: React.FC<DiceLockAnimationProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className={styles.overlay}>
      <span className={styles.lockEmoji}>🔒</span>
    </div>
  );
};

export default DiceLockAnimation;
