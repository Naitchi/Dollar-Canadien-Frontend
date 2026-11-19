import { useEffect, useRef, useState } from 'react';

import { Avatar as AvatarData } from '@/functions/game';
import { Player } from '@/types/gameType';

import PlayerCard from '../Player/Player';
import Icon from '../ui/Icon';
import styles from './Lobby.module.css';

// How long the kick confirmation stays armed.
const CONFIRM_MS = 4000;

interface KickButtonProps {
  name: string;
  onKick: () => void;
}

// Two steps on the same button (focus stays put): "Exclure" → "Confirmer ?".
const KickButton = ({ name, onKick }: KickButtonProps) => {
  const [armed, setArmed] = useState(false);
  const focused = useRef(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timeout.current), []);

  const disarmLater = () => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      // Never disarms under the player's finger / keyboard focus.
      if (!focused.current) setArmed(false);
    }, CONFIRM_MS);
  };

  return (
    <button
      type="button"
      className={`${styles.kick} ${armed ? styles.kickArmed : ''}`}
      onClick={() => {
        if (armed) {
          clearTimeout(timeout.current);
          onKick();
          return;
        }
        setArmed(true);
        disarmLater();
      }}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        if (armed) disarmLater();
      }}
      aria-label={armed ? `Confirmer l'exclusion de ${name}` : `Exclure ${name}`}
    >
      <Icon name="close" size={16} />
      {armed && <span aria-hidden="true">Confirmer ?</span>}
    </button>
  );
};

interface PlayerListProps {
  players: Player[];
  avatars: Record<string, AvatarData>;
  maxHp: number;
  hostId?: string;
  // Our public id, to show "Toi" next to our name.
  me: string | null;
  // The host can kick the other players.
  canKick: boolean;
  onKick: (playerId: string) => void;
  // Empty seats left (shows one "invite" placeholder).
  seatsLeft: number;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, avatars, maxHp, hostId, me, canKick, onKick, seatsLeft }) => (
  <ul role="list" className={styles.players}>
    {players.map((player) => (
      <li key={player._id}>
        <PlayerCard
          player={player}
          avatar={avatars[player.username]}
          maxHp={maxHp}
          isMe={player._id === me}
          lobby={{ isHost: player._id === hostId }}
          action={
            canKick && player._id !== me ? (
              <KickButton name={player.username} onKick={() => onKick(player._id)} />
            ) : undefined
          }
        />
      </li>
    ))}
    {/* TODO pour ca il faut aussi interdire de rerejoindre via l'ip ou un truc comme ca, ou alors changer l'id de la game et rediriger le reste de la room */}
    {seatsLeft > 0 && (
      <li className={styles.ghostSeat} aria-hidden="true">
        <span className={styles.ghostAvatar}>+</span>
        En attente d&apos;un pote…
      </li>
    )}
  </ul>
);

export default PlayerList;
