import { useEffect, useRef, useState } from 'react';

// Styles
import styles from './Board.module.css';

// How long the "select a die first" bubble stays up.
const HINT_DURATION_MS = 2500;

interface LockButtonProps {
  hasSelection: boolean;
  onLock: () => void;
}

// Locks the selected dice. Clicked without any die selected, it explains
// why nothing happens instead of doing nothing.
const LockButton: React.FC<LockButtonProps> = ({ hasSelection, onLock }) => {
  const [showHint, setShowHint] = useState(false);
  const hintTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(hintTimeout.current), []);

  const handleClick = () => {
    clearTimeout(hintTimeout.current);
    if (!hasSelection) {
      setShowHint(true);
      hintTimeout.current = setTimeout(() => setShowHint(false), HINT_DURATION_MS);
      return;
    }
    setShowHint(false);
    onLock();
  };

  return (
    <div className={styles.lockArea}>
      {showHint && (
        <p className={styles.lockHint} role="alert">
          Il faut verrouiller au moins un dé par tour 🎲
        </p>
      )}
      <button
        className={`${styles.lockButton} ${hasSelection ? '' : styles.idle}`}
        onClick={handleClick}
      >
        Lock the dices 🔒
      </button>
    </div>
  );
};

export default LockButton;
