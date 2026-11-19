// Functions
import { beatDuration, lowHealthIntensity } from '@/functions/functions';
import { isInDanger } from '@/functions/game';

// Styles
import styles from './LowHealthVignette.module.css';

// Each beat has two pulses: a beat of at least 1 s keeps the red edges under
// 3 flashes per second (WCAG 2.3.1), even when the heart races.
const MIN_BEAT_S = 1;
// A looping animation stops within 5 s (WCAG 2.2.2); it plays again when the
// HP change.
const PULSING_FOR_S = 5;

interface LowHealthVignetteProps {
  hp: number;
  maxHp: number;
}

// Red screen edges when our player is about to die, like in shooters: the
// fewer HP left, the stronger, pulsing with the player's heartbeat.
const LowHealthVignette: React.FC<LowHealthVignetteProps> = ({ hp, maxHp }) => {
  if (!isInDanger(hp, maxHp)) return null;
  const intensity = lowHealthIntensity(hp) || 0.35;
  const duration = Math.max(beatDuration(hp, maxHp), MIN_BEAT_S);

  return (
    <div className={styles.vignette} style={{ opacity: intensity }} aria-hidden="true">
      <div
        key={hp}
        className={styles.pulse}
        style={{
          animationDuration: `${duration}s`,
          animationIterationCount: Math.max(1, Math.round(PULSING_FOR_S / duration)),
        }}
      />
    </div>
  );
};

export default LowHealthVignette;
