// Style
import styles from './Player.module.css';

// Components
import Heart from '../Heart/Heart';

// Type
import { Player } from '@/types/gameType';
interface PlayerComponent {
  player: Player;
  maxHp: number;
}

const PlayerComponent: React.FC<PlayerComponent> = ({ player, maxHp }) => {
  const alive = player.hp > 0;
  return (
    <div className={`${styles.player} ${alive ? '' : styles.dead}`}>
      <p className={styles.avatar}>{alive ? '🙍‍♂️' : '💀'}</p>
      <p className={styles.name} title={player.username}>
        {player.username}
      </p>
      <p className={styles.hp}>
        {player.hp} <Heart hp={player.hp} maxHp={maxHp} />
      </p>
    </div>
  );
};

export default PlayerComponent;
