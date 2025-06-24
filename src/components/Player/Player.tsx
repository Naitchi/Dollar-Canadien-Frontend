// Style
import styles from './Player.module.css';

// Type
import { Player } from '@/types/gameType';
interface PlayerComponent {
  player: Player;
}

const PlayerComponent: React.FC<PlayerComponent> = ({ player }) => {
  return player.hp > 0 ? (
    <div className={styles.player}>
      <p>🙍‍♂️</p>
      <p>{player.username}</p>
      <p>
        {player.hp} <span className={styles.heart}>❤</span>
      </p>
    </div>
  ) : (
    <div className={styles.player}>
      <p>💀</p>
      <p>{player.username}</p>
      <p>
        {player.hp} <span className={styles.heart}>💔</span>
      </p>
    </div>
  );
};

export default PlayerComponent;
