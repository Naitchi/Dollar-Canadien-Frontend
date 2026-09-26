// Functions
import { beatDuration, lowHealthIntensity } from '@/functions/functions';

// Styles
import styles from './LowHealthVignette.module.css';

interface LowHealthVignetteProps {
  hp: number;
  maxHp: number;
}

// Red screen edges when our player is about to die, like in shooters: the
// fewer HP left, the stronger, pulsing with the player's heartbeat.
const LowHealthVignette: React.FC<LowHealthVignetteProps> = ({ hp, maxHp }) => {
  const intensity = lowHealthIntensity(hp);
  if (intensity === 0) return null;

  return (
    <div className={styles.vignette} style={{ opacity: intensity }} aria-hidden="true">
      <div
        className={styles.pulse}
        style={{ animationDuration: `${beatDuration(hp, maxHp)}s` }}
      />
    </div>
  );
};

export default LowHealthVignette;
