// Style
import styles from './Lobby.module.css';

// Types
import { Player } from '@/types/gameType';

interface PlayerListProps {
  players: Player[];
  hostId?: string;
  // Our public id, to show "(toi)" next to our name.
  me: string | null;
  // The host can kick the other players.
  canKick: boolean;
  onKick: (playerId: string) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, hostId, me, canKick, onKick }) => (
  <ul className={styles.players}>
    {players.map((player) => (
      <li className={styles.playerRow} key={player._id}>
        <span className={styles.avatar} aria-hidden="true">
          🙍‍♂️
        </span>
        <span className={styles.playerName}>
          {player.username}
          {player._id === me && <span className={styles.you}> (toi)</span>}
        </span>
        {player._id === hostId ? (
          <span className={`${styles.badge} ${styles.hostBadge}`}>👑 Host</span>
        ) : (
          <span className={`${styles.badge} ${player.ready ? styles.ready : ''}`}>
            {player.ready ? 'Prêt' : 'Pas prêt'}
          </span>
        )}
        {canKick && player._id !== me && (
          <button
            className={styles.kickButton}
            onClick={() => onKick(player._id)}
            aria-label={`Exclure ${player.username}`}
            title="Exclure du salon"
          >
            ✕
          </button>
        )}
      </li>
    ))}
    {/* TODO pour ca il faut aussi interdire de rerejoindre via l'ip ou un truc comme ca, ou alors changer l'id de la game et rediriger le reste de la room */}
  </ul>
);

export default PlayerList;
