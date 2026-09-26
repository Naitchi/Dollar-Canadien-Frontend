import Link from 'next/link';
import { RootState } from '@/store/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

// Services
import { restartGame } from '@/services/services';

// Store
import { getMe, getUser } from '@/store/slices/clientSlice';

// Functions
import { STAKE_TARGET_LABELS, getRanking, stakeBearers } from '@/functions/functions';

// Components
import Confetti from '../Confetti/Confetti';

// Styles
import styles from './Results.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

const Results = () => {
  const lobby = useSelector((state: RootState) => state.game.game);
  const me = useSelector(getMe);
  const user = useSelector(getUser);

  const ranking = useMemo(() => (lobby ? getRanking(lobby) : []), [lobby]);
  const winner = ranking[0];
  const isHost = !!me && lobby?.host?.id === me;
  const stake = lobby?.stake;
  const bearers = stake?.text ? stakeBearers(stake.target, ranking) : [];

  const replay = () => {
    if (lobby && user) restartGame(user, lobby._id);
  };

  return (
    <div className={styles.Results}>
      <Confetti />
      <p className={styles.trophy} aria-hidden="true">
        🏆
      </p>
      <h2 className={styles.title}>{winner?.username} a gagné !</h2>
      <p className={styles.subtitle}>OUAIS GG YIPEE</p>

      {stake?.text && bearers.length > 0 && (
        <div className={styles.stake}>
          <p className={styles.stakeLabel}>
            🎯 {STAKE_TARGET_LABELS[stake.target]} doit :
          </p>
          <p className={styles.stakeText}>{stake.text}</p>
          <p className={styles.stakeWho}>
            {bearers.map((player) => player.username).join(', ')}
          </p>
        </div>
      )}

      <ol className={styles.ranking}>
        {ranking.map((player, index) => {
          const isFirstLoser = index === ranking.length - 1 && ranking.length > 1;
          return (
            <li
              key={player._id}
              className={`${styles.rank} ${index === 0 ? styles.winner : ''}`}
            >
              <span className={styles.place}>{MEDALS[index] ?? `${index + 1}.`}</span>
              <span className={styles.name}>
                {player.username}
                {player._id === me && <span className={styles.you}> (toi)</span>}
              </span>
              <span className={styles.detail}>
                {index === 0 ? `${player.hp} ❤` : isFirstLoser ? 'Premier éliminé 💀' : 'Éliminé'}
              </span>
            </li>
          );
        })}
      </ol>

      <div className={styles.actions}>
        {isHost ? (
          <button className={styles.button} onClick={replay}>
            Rejouer avec les mêmes joueurs
          </button>
        ) : (
          <p className={styles.waiting}>L&apos;host peut relancer une partie avec les mêmes joueurs.</p>
        )}
        <Link className={styles.secondaryButton} href="/">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
};

export default Results;
