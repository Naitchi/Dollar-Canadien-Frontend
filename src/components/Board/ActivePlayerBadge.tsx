// Components
import Heart from '../Heart/Heart';

// Styles
import styles from './Board.module.css';

// Types
import { Player } from '@/types/gameType';

interface ActivePlayerBadgeProps {
  player: Player | null;
  maxHp: number;
  // Shakes and flashes red: the player takes damage (score under 30).
  hurt: boolean;
}

// The player whose turn it is, on top of the dice box.
const ActivePlayerBadge: React.FC<ActivePlayerBadgeProps> = ({ player, maxHp, hurt }) => (
  <div className={`${styles.activePlayer} ${hurt ? styles.hurt : ''}`}>
    <p className={styles.avatar}>🙍‍♂️</p>
    <p className={styles.name}>{player?.username}</p>
    <p>
      {player?.hp} <Heart hp={player?.hp ?? 0} maxHp={maxHp} />
    </p>
  </div>
);

export default ActivePlayerBadge;
