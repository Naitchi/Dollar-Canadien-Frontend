import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

// Store
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { getMe } from '@/store/slices/clientSlice';

// Services
import { changeOptions, changeReadyStatus, removeAPlayer, startAGame } from '@/services/services';

// Hooks
import { useTableAvatars } from '@/hooks/useTableAvatars';
import { useLobbyMembership } from './useLobbyMembership';

// Components
import { useAnnounce } from '../Announcer/Announcer';
import HowToPlay from '../HowToPlay/HowToPlay';
import StateCard from '../StateCard/StateCard';
import Badge from '../ui/Badge';
import Button, { buttonClass } from '../ui/Button';
import Icon from '../ui/Icon';
import InviteLink from './InviteLink';
import JoinCard from './JoinCard';
import PlayerList from './PlayerList';
import RulesCard, { OptionsChange } from './RulesCard';

// Style
import frame from '../layout/GameFrame.module.css';
import surface from '../ui/Surface.module.css';
import styles from './Lobby.module.css';

// startGame is fire-and-forget: if nothing happened after this long, check
// with the server and let the host try again.
const START_TIMEOUT_MS = 8000;

/** "Gaston", "Gaston et Martine", "Gaston, Martine et 2 autres". */
const listNames = (names: string[]): string => {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]} et ${names[2]}`;
  return `${names[0]}, ${names[1]} et ${names.length - 2} autres`;
};

interface LobbyProps {
  onResync: () => Promise<void>;
}

const Lobby = ({ onResync }: LobbyProps) => {
  const router = useRouter();
  const announce = useAnnounce();
  const lobby = useSelector((state: RootState) => state.game.game);
  // Our public id in this game (null until we've joined it).
  const me = useSelector(getMe);
  const { user, askUsername, submitUsername, joinError } = useLobbyMembership();
  const avatars = useTableAvatars();

  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [readyPending, setReadyPending] = useState(false);
  const [startPending, setStartPending] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  // The last options change sent to the server (see startGame).
  const pendingOptionsSave = useRef<Promise<void> | null>(null);
  const startTimeout = useRef<ReturnType<typeof setTimeout>>();

  const isHost = !!me && lobby?.host?.id === me;
  const players = lobby?.players ?? [];
  const meAsPlayer = players.find((player) => player._id === me);
  const enoughPlayers = players.length >= 2;
  const notReady = players.filter((player) => !player.ready && player._id !== lobby?.host?.id);
  const everyoneReady = notReady.length === 0;
  const canStart = isHost && enoughPlayers && everyoneReady;
  const hostName = lobby?.host?.username ?? '';

  // The host role moves to someone else when the host leaves the lobby.
  const wasHost = useRef(isHost);
  useEffect(() => {
    if (isHost && !wasHost.current) announce("Tu es maintenant l'hôte de la table.", 'assertive');
    wasHost.current = isHost;
  }, [isHost, announce]);

  useEffect(() => () => clearTimeout(startTimeout.current), []);

  // The sticky action bar: focused elements scroll above it (WCAG 2.4.11).
  useEffect(() => {
    document.documentElement.classList.add('sticky-bar');
    return () => document.documentElement.classList.remove('sticky-bar');
  }, []);

  const changeLobbyOptions = (options: OptionsChange) => {
    if (!lobby) return;
    pendingOptionsSave.current = changeOptions(user, lobby._id, {
      maxHp: options.maxHp ?? lobby.maxHp,
      maxPlayers: options.maxPlayers ?? lobby.maxPlayers,
      stake: options.stake,
    })
      .then(() => setOptionsError(null))
      .catch((error: Error) => setOptionsError(error.message));
  };

  const kick = (playerId: string) => {
    if (lobby) removeAPlayer(user, lobby._id, playerId).catch(console.error);
  };

  const quit = () => {
    if (lobby && me) removeAPlayer(user, lobby._id, me).catch(console.error);
    router.push('/');
  };

  const toggleReady = () => {
    if (!lobby || readyPending) return;
    setReadyPending(true);
    changeReadyStatus(user, lobby._id)
      .catch((error: Error) => announce(error.message || "Ça n'a pas marché. Réessaie.", 'assertive'))
      .finally(() => setReadyPending(false));
  };

  const status = !meAsPlayer && !isHost
    ? 'Tu regardes ce salon.'
    : isHost
      ? !enoughPlayers
        ? "Il faut au moins 2 joueurs : invite quelqu'un !"
        : !everyoneReady
          ? `En attente de ${listNames(notReady.map((player) => player.username))}`
          : 'Tout le monde est prêt !'
      : meAsPlayer?.ready
        ? `T'es prêt ! En attente de ${hostName} pour lancer.`
        : "Dis-nous quand t'es prêt.";

  const startGame = async () => {
    if (!lobby || startPending) return;
    if (!canStart) {
      announce(status, 'assertive');
      return;
    }
    setStartError(null);
    setStartPending(true);
    // The stake field saves when it loses focus, which happens right before
    // this click: wait for that save, options can't change once the game has started.
    await pendingOptionsSave.current;
    startAGame(user, lobby._id);
    clearTimeout(startTimeout.current);
    startTimeout.current = setTimeout(async () => {
      await onResync();
      setStartPending(false);
      setStartError("La partie n'a pas démarré. Réessaie.");
      announce("La partie n'a pas démarré. Réessaie.", 'assertive');
    }, START_TIMEOUT_MS);
  };

  if (!user.username) {
    return askUsername ? (
      <JoinCard hostName={lobby?.host?.username} playerCount={players.length} onSubmit={submitUsername} />
    ) : (
      <div className={styles.centered} aria-busy="true" />
    );
  }

  if (joinError) {
    return (
      <StateCard
        tone="error"
        title="Impossible de rejoindre la table"
        actions={
          <Link href="/" className={buttonClass({ variant: 'primary' })}>
            Retour à l&apos;accueil
          </Link>
        }
      >
        <p>{joinError}</p>
      </StateCard>
    );
  }

  // We were in the lobby, and we aren't anymore: the host removed us.
  if (me && lobby && !meAsPlayer) {
    return (
      <StateCard
        tone="error"
        title="Tu as été retiré de la table"
        actions={
          <Link href="/" className={buttonClass({ variant: 'primary' })}>
            Retour à l&apos;accueil
          </Link>
        }
      >
        <p>L&apos;hôte t&apos;a exclu de ce salon. Tu peux créer ta propre partie depuis l&apos;accueil.</p>
      </StateCard>
    );
  }

  return (
    <div className={`${frame.page} ${styles.page}`}>
      <div className={`${frame.frame} ${styles.frame}`}>
        <aside className={`${frame.sidebar} ${styles.playersArea}`} aria-labelledby="joueurs-titre">
          <div className={frame.panel}>
            <div className={frame.panelHeader}>
              <h2 id="joueurs-titre" className={frame.panelTitle}>
                <Icon name="users" size={18} /> Joueurs ({players.length}/{lobby?.maxPlayers})
              </h2>
              <Badge tone="chip">Salon</Badge>
            </div>
            <div className={frame.panelList}>
              <PlayerList
                players={players}
                avatars={avatars}
                maxHp={lobby?.maxHp ?? 30}
                hostId={lobby?.host?.id}
                me={me}
                canKick={isHost}
                onKick={kick}
                seatsLeft={(lobby?.maxPlayers ?? 0) - players.length}
              />
            </div>
          </div>
        </aside>

        <div className={`${frame.main} ${styles.main}`}>
          <header className={styles.head}>
            <h1 className={styles.title}>
              La table de <span>{hostName}</span>
            </h1>
            <p className={styles.subtitle}>
              {isHost
                ? 'Invite tes potes, règle la partie, puis lance quand tout le monde est prêt.'
                : 'Mets-toi prêt : la partie commence quand l’hôte la lance.'}
            </p>
          </header>

          <div className={styles.inviteArea}>
            <InviteLink />
          </div>

          <div className={styles.rulesArea}>
            {lobby && <RulesCard lobby={lobby} isHost={isHost} error={isHost ? optionsError : null} onChange={changeLobbyOptions} />}
          </div>

          <details className={`${surface.paper} ${styles.howTo}`}>
            <summary className={styles.howToSummary}>
              <Icon name="help" size={20} /> Comment on joue ?
              <span className={styles.howToHint}>30 secondes de lecture</span>
              <Icon name="chevronDown" size={18} className={styles.chevron} />
            </summary>
            <div className={styles.howToBody}>
              <HowToPlay variant="compact" maxHp={lobby?.maxHp} />
            </div>
          </details>
        </div>
      </div>

      <div className={styles.actionBar}>
        <p className={styles.status} role="status">
          {(isHost ? canStart : meAsPlayer?.ready) ? <Icon name="check" size={18} /> : <Icon name="clock" size={18} />}
          {startError ?? status}
        </p>
        <div className={styles.actionButtons}>
          <Button variant="quiet" icon="logout" onClick={quit} aria-label="Quitter le salon">
            <span className={styles.quitText}>Quitter</span>
          </Button>
          {isHost ? (
            <Button
              variant="success"
              size="lg"
              icon="dice"
              onClick={startGame}
              unavailable={!canStart}
              pending={startPending}
              aria-describedby={undefined}
            >
              {startPending ? 'Lancement…' : 'Lancer la partie'}
            </Button>
          ) : (
            meAsPlayer && (
              <Button
                variant={meAsPlayer.ready ? 'neutral' : 'success'}
                size="lg"
                icon={meAsPlayer.ready ? 'check' : 'hand'}
                onClick={toggleReady}
                pending={readyPending}
                aria-pressed={meAsPlayer.ready}
              >
                {meAsPlayer.ready ? 'Prêt ! (annuler)' : 'Je suis prêt'}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
