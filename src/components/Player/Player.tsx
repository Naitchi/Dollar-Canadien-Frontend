import { ReactNode } from 'react';

import { Avatar as AvatarData, isInDanger, shownHp } from '@/functions/game';
import { Player } from '@/types/gameType';

import Heart from '../Heart/Heart';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import HpBar from '../ui/HpBar';
import styles from './Player.module.css';

interface PlayerCardProps {
  player: Player;
  avatar: AvatarData;
  maxHp: number;
  isMe?: boolean;
  // Board only: whose turn it is.
  isActive?: boolean;
  // Lobby only: show ready/host instead of HP.
  lobby?: { isHost: boolean };
  // Just took damage (shakes once).
  hit?: boolean;
  // "Dernier tour : 24" (desktop board).
  lastTurn?: number | null;
  compact?: boolean;
  // Extra controls on the right (kick button in the lobby).
  action?: ReactNode;
}

// One player card for the whole app (lobby, board rail, phone list):
// avatar tile, name, PV + bar, and status badges written as text.
const PlayerCard = ({
  player,
  avatar,
  maxHp,
  isMe = false,
  isActive = false,
  lobby,
  hit = false,
  lastTurn = null,
  compact = false,
  action,
}: PlayerCardProps) => {
  const hp = shownHp(player.hp);
  const dead = !lobby && player.hp <= 0;
  const danger = !lobby && isInDanger(player.hp, maxHp);

  const classes = [
    styles.card,
    compact ? styles.compact : '',
    isMe ? styles.me : '',
    isActive ? styles.active : '',
    danger ? styles.danger : '',
    dead ? styles.dead : '',
    hit ? styles.hit : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <Avatar avatar={avatar} size={compact ? 'sm' : 'md'} dead={dead} />
      <div className={styles.body}>
        <p className={styles.nameRow}>
          <span className={styles.name} title={player.username}>
            {player.username}
          </span>
          {isMe && <Badge tone="green">Toi</Badge>}
        </p>
        {lobby ? (
          <p className={styles.badges}>
            {lobby.isHost ? (
              <Badge tone="yellow" icon="crown">
                Hôte
              </Badge>
            ) : player.ready ? (
              <Badge tone="green" icon="check">
                Prêt
              </Badge>
            ) : (
              <Badge tone="muted">Pas prêt</Badge>
            )}
          </p>
        ) : (
          <>
            <div className={styles.hpRow}>
              <Heart hp={player.hp} maxHp={maxHp} beating={!dead && (isMe || danger)} />
              <span className={styles.hp}>
                <span className={styles.hpValue}>{dead ? 0 : hp}</span>
                <span className={styles.hpUnit}> PV</span>
              </span>
              {dead ? (
                <Badge tone="ink" icon="skull" className={styles.status}>
                  K.O.
                </Badge>
              ) : isActive ? (
                // Active and in danger: both said in words, not by colour alone.
                <Badge tone={danger ? 'coral' : 'blue'} icon="dice" className={styles.status}>
                  {danger ? 'Joue · danger' : 'Joue'}
                </Badge>
              ) : danger ? (
                <Badge tone="coral" icon="alert" className={styles.status}>
                  Danger
                </Badge>
              ) : null}
            </div>
            {/* Full body width: the same scale on every card. */}
            <HpBar hp={player.hp} maxHp={maxHp} danger={danger} />
          </>
        )}
        {!lobby && !compact && lastTurn !== null && !isActive && !dead && (
          <span className={styles.lastTurn}>Dernier tour : {lastTurn}</span>
        )}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
};

export default PlayerCard;
