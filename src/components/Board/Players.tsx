import { useId, useState } from 'react';

import { Avatar as AvatarData, isInDanger, lastTurnScore, shownHp } from '@/functions/game';
import { Player } from '@/types/gameType';

import PlayerCard from '../Player/Player';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Icon from '../ui/Icon';
import frame from '../layout/GameFrame.module.css';
import styles from './Board.module.css';

interface PlayersProps {
  // Displayed players (HP of the turn being animated hidden), in rail order.
  players: Player[];
  avatars: Record<string, AvatarData>;
  maxHp: number;
  me: string | null;
  activeId: string | null;
  nextId: string | null;
  // Players who just took damage (cards shake once).
  hitIds: Set<string>;
}

const aliveCount = (players: Player[]) => players.filter((player) => player.hp > 0).length;

// Desktop: the reference's dark sidebar listing everyone.
export const PlayerRail = ({ players, avatars, maxHp, me, activeId, hitIds }: PlayersProps) => (
  <div className={frame.panel}>
    <div className={frame.panelHeader}>
      <h2 className={frame.panelTitle}>
        <Icon name="users" size={18} /> Joueurs · {aliveCount(players)} en vie
      </h2>
      <Badge tone="chip">En jeu</Badge>
    </div>
    <ul role="list" className={frame.panelList}>
      {players.map((player) => (
        <li key={player._id}>
          <PlayerCard
            player={player}
            avatar={avatars[player.username]}
            maxHp={maxHp}
            isMe={player._id === me}
            isActive={player._id === activeId}
            hit={hitIds.has(player._id)}
            lastTurn={lastTurnScore(player)}
          />
        </li>
      ))}
    </ul>
  </div>
);

// Phone: a strip that never scrolls, pinning me, the active player and the
// next one; "Tous" opens the full list in place (not a modal: the game
// stays usable and its announcements audible).
export const PlayerStrip = ({ players, avatars, maxHp, me, activeId, nextId, hitIds }: PlayersProps) => {
  const [open, setOpen] = useState(false);
  const listId = useId();
  // Active player, then us, then the next one (hidden on narrow phones: the
  // turn card already says who's next).
  const pinnedIds = [activeId, me, nextId].filter(
    (value, index, all): value is string => !!value && all.indexOf(value) === index,
  );
  const pinned = pinnedIds
    .map((id) => players.find((player) => player._id === id))
    .filter((player): player is Player => !!player);

  return (
    <div className={styles.strip}>
      <ul role="list" className={styles.stripList}>
        {pinned.map((player) => {
          const role = player._id === activeId ? 'Joue' : player._id === nextId ? 'Ensuite' : 'Toi';
          const danger = isInDanger(player.hp, maxHp);
          return (
            <li
              key={player._id}
              className={`${styles.chip} ${player._id === activeId ? styles.chipActive : ''} ${
                danger ? styles.chipDanger : ''
              } ${hitIds.has(player._id) ? styles.chipHit : ''}`}
            >
              <Avatar avatar={avatars[player.username]} size="xs" dead={player.hp <= 0} />
              <span className={styles.chipText}>
                <span className={styles.chipName}>{player.username}</span>
                <span className={styles.chipMeta}>
                  {/* PV first and never cut; the role can shorten. */}
                  <span className={styles.chipHp}>
                    {shownHp(player.hp)}
                    <span className="sr-only"> points de vie</span>
                    <span aria-hidden="true"> PV</span>
                  </span>
                  <span className={styles.chipRole}>
                    <span aria-hidden="true">{' · '}</span>
                    {role}
                    {player._id === me && role !== 'Toi' && <span className="sr-only"> (toi)</span>}
                  </span>
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className={styles.stripAll}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="users" size={18} />
        <span className={styles.stripAllText}>Tous</span>
        <span>{players.length}</span>
        <span className="sr-only"> joueurs : voir la liste</span>
        <Icon name="chevronDown" size={16} className={open ? styles.flipped : ''} />
      </button>
      <div id={listId} hidden={!open} className={styles.stripPanel}>
        <ul role="list" className={styles.stripPanelList}>
          {players.map((player) => (
            <li key={player._id}>
              <PlayerCard
                compact
                player={player}
                avatar={avatars[player.username]}
                maxHp={maxHp}
                isMe={player._id === me}
                isActive={player._id === activeId}
                hit={hitIds.has(player._id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
