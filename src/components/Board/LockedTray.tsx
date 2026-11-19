import { DICE_PER_TURN, TARGET_SCORE } from '@/functions/game';

import DieFace from '../ui/DieFace';
import Icon from '../ui/Icon';
import surface from '../ui/Surface.module.css';
import styles from './Board.module.css';

// The meter goes up to the highest possible score (6 × 6).
const METER_MAX = DICE_PER_TURN * 6;

interface LockedTrayProps {
  // Locked dice as confirmed by the server (never optimistic).
  locked: number[];
  // Sum of the dice currently selected on the mat (our turn only).
  selectedSum: number;
  // "Tes dés gardés" / "Dés gardés par Gaston".
  owner: string;
}

// The reference's dashed amber zone: the dice kept for the score, the total,
// and a gauge against 30 (decorative: the numbers are written).
const LockedTray = ({ locked, selectedSum, owner }: LockedTrayProps) => {
  const total = locked.reduce((sum, value) => sum + value, 0);
  const slots = Array.from({ length: DICE_PER_TURN }, (_, index) => locked[index] ?? null);
  const lockedWidth = (Math.min(total, METER_MAX) / METER_MAX) * 100;
  const selectedWidth = (Math.min(selectedSum, METER_MAX - total) / METER_MAX) * 100;

  return (
    <section className={styles.tray} aria-labelledby="tray-title">
      <div className={styles.sectionHead}>
        <h2 id="tray-title" className={surface.sectionTitle}>
          <span className={styles.lockBadge} aria-hidden="true">
            <Icon name="lock" size={13} />
          </span>
          {owner}
        </h2>
        <p className={styles.trayCount}>
          {locked.length}/{DICE_PER_TURN} dés · <strong>Total {total}</strong>
        </p>
      </div>
      <div className={styles.trayZone}>
        {locked.length === 0 ? (
          <p className={styles.trayEmpty}>
            <Icon name="lock" size={16} /> Les dés gardés arrivent ici
          </p>
        ) : (
          <ul role="list" className={styles.trayDice} aria-label={`Dés gardés : ${locked.join(', ')}`}>
            {slots.map((value, index) => (
              <li key={index} className={value !== null ? styles.trayPop : undefined}>
                <DieFace value={value} size={38} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.meter} aria-hidden="true">
        <span className={styles.meterLocked} style={{ width: `${lockedWidth}%` }} />
        <span className={styles.meterSelected} style={{ left: `${lockedWidth}%`, width: `${selectedWidth}%` }} />
        <span className={styles.meterNotch} style={{ left: `${(TARGET_SCORE / METER_MAX) * 100}%` }}>
          <span>30</span>
        </span>
      </div>
    </section>
  );
};

export default LockedTray;
