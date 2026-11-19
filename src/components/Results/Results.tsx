import Link from 'next/link';
import { RootState } from '@/store/store';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Services
import { restartGame } from '@/services/services';

// Store
import { getMe, getUser } from '@/store/slices/clientSlice';

// Functions
import { STAKE_TARGET_LABELS, getRanking, stakeBearers } from '@/functions/functions';
import { ordinal, shownHp, stakeSubject } from '@/functions/game';

// Hooks
import { useTableAvatars } from '@/hooks/useTableAvatars';

// Components
import { useAnnounce } from '../Announcer/Announcer';
import Confetti from '../Confetti/Confetti';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button, { buttonClass } from '../ui/Button';
import Icon from '../ui/Icon';

// Styles
import styles from './Results.module.css';

const MEDALS = ['🥇', '🥈', '🥉'];

// restartGame is fire-and-forget: re-enable the button if nothing happened.
const REPLAY_TIMEOUT_MS = 8000;

const Results = () => {
  const lobby = useSelector((state: RootState) => state.game.game);
  const me = useSelector(getMe);
  const user = useSelector(getUser);
  const avatars = useTableAvatars();
  const announce = useAnnounce();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [replayPending, setReplayPending] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const ranking = useMemo(() => (lobby ? getRanking(lobby) : []), [lobby]);
  const winner = ranking[0];
  const isHost = !!me && lobby?.host?.id === me;
  const myRank = ranking.findIndex((player) => player._id === me) + 1;
  const iWon = !!winner && winner._id === me;
  const stake = lobby?.stake;
  const bearers = stake?.text ? stakeBearers(stake.target, ranking) : [];
  const subject = stakeSubject(
    bearers.filter((player) => player._id !== me).map((player) => player.username),
    bearers.some((player) => player._id === me),
  );
  const hostName = lobby?.host?.username ?? "l'hôte";
  const winnerName = winner?.username ?? 'Quelqu’un';

  // Personal first: the winner, a player (their rank), or a spectator.
  const headline = iWon ? "T'as gagné !" : myRank > 1 ? `Tu finis ${ordinal(myRank)} sur ${ranking.length}` : `${winnerName} a gagné !`;
  const subline = !iWon && myRank > 1 ? `${winnerName} a gagné la partie.` : null;
  const gageSentence = stake?.text && bearers.length > 0 ? `${subject} : ${stake.text}` : null;

  useEffect(() => {
    setCanShare(typeof navigator.share === 'function');
    headingRef.current?.focus();
    announce([headline, subline, gageSentence ? `Gage : ${gageSentence}.` : null].filter(Boolean).join(' '));
    // Once, when the results appear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!replayPending) return;
    const timeout = setTimeout(() => {
      setReplayPending(false);
      announce("La partie n'a pas été relancée. Réessaie.", 'assertive');
    }, REPLAY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [replayPending, announce]);

  const replay = () => {
    if (!lobby || !user || replayPending) return;
    setReplayPending(true);
    restartGame(user, lobby._id);
  };

  const shareGage = async () => {
    if (!gageSentence) return;
    try {
      await navigator.share({ title: 'Dollar Canadien', text: `🎲 Dollar Canadien — ${gageSentence}` });
    } catch {
      // Cancelled: nothing to do.
    }
  };

  return (
    <div className={styles.page}>
      <Confetti />
      <section className={styles.Results} aria-labelledby="results-title">
        <div className={styles.hero}>
          {winner && (
            <span className={styles.winnerAvatar}>
              <Avatar avatar={avatars[winner.username]} size="lg" />
              <span className={styles.trophy} aria-hidden="true">
                🏆
              </span>
            </span>
          )}
          <h1 id="results-title" className={styles.title} ref={headingRef} tabIndex={-1}>
            {headline}
          </h1>
          {/* The owner's cheer: for the winner (and the spectators), not to rub it in. */}
          {(iWon || myRank === 0) && <p className={styles.kicker}>OUAIS GG YIPEE</p>}
          {subline && <p className={styles.subtitle}>{subline}</p>}
        </div>

        {gageSentence && stake && (
          <div className={styles.stake}>
            <p className={styles.stakeLabel}>
              <Icon name="target" size={18} /> Le gage · {STAKE_TARGET_LABELS[stake.target].toLowerCase()}
            </p>
            <p className={styles.stakeWho}>{subject} :</p>
            <p className={styles.stakeText}>{stake.text}</p>
            {canShare && (
              <Button size="sm" variant="neutral" icon="share" onClick={shareGage}>
                Partager le gage
              </Button>
            )}
          </div>
        )}

        <div className={styles.actions}>
          {isHost ? (
            <>
              <Button
                variant="primary"
                size="xl"
                block
                iconPill="refresh"
                onClick={replay}
                pending={replayPending}
                aria-describedby="replay-hint"
              >
                {replayPending ? 'Relance…' : 'Rejouer'}
              </Button>
              <p id="replay-hint" className={styles.replayHint}>
                Mêmes joueurs, mêmes règles : retour au salon (tu pourras changer le gage).
              </p>
            </>
          ) : (
            <p className={styles.waiting}>
              <Icon name="clock" size={18} />
              {me
                ? `Si ${hostName} relance, tu reviendras au salon avec les mêmes joueurs.`
                : `Si ${hostName} relance, une nouvelle partie démarrera au salon.`}
            </p>
          )}
        </div>

        <div className={styles.rankingBlock}>
          <h2 className={styles.rankingTitle}>Classement</h2>
          <ol className={styles.ranking}>
            {ranking.map((player, index) => {
              const isFirstLoser = index === ranking.length - 1 && ranking.length > 1;
              return (
                <li key={player._id} className={`${styles.rank} ${index === 0 ? styles.winner : ''}`}>
                  <span className={styles.place}>
                    <span aria-hidden="true">{MEDALS[index] ?? `${index + 1}`}</span>
                    <span className="sr-only">{ordinal(index + 1)}</span>
                  </span>
                  <Avatar avatar={avatars[player.username]} size="sm" dead={index > 0} />
                  <span className={styles.who}>
                    <span className={styles.name}>{player.username}</span>
                    <span className={styles.detail}>
                      {index === 0 ? `${shownHp(player.hp)} PV restants` : isFirstLoser ? 'Premier éliminé 💀' : 'Éliminé'}
                    </span>
                  </span>
                  {player._id === me && <Badge tone="green">Toi</Badge>}
                </li>
              );
            })}
          </ol>
        </div>

        <Link className={buttonClass({ variant: 'quiet', block: true })} href="/">
          Retour à l&apos;accueil
        </Link>
      </section>
    </div>
  );
};

export default Results;
