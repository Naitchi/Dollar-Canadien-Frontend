import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getMe, getUser, setClockOffset, setMe, setUser } from '@/store/slices/clientSlice';
import { setGame, updatePlayers } from '@/store/slices/gameSlice';

import { STAKE_TARGET_LABELS, getRanking, getStoredUser } from '@/functions/functions';
import { setLastGameId } from '@/functions/prefs';
import { getPusher } from '../functions/pusher';

import { useAnnounce } from '@/components/Announcer/Announcer';
import Board from '@/components/Board/Board';
import { ChatPanel, ChatToggle } from '@/components/Chat/Chat';
import { useChat } from '@/components/Chat/useChat';
import DeathOverlay from '@/components/DeathOverlay/DeathOverlay';
import HowToPlay from '@/components/HowToPlay/HowToPlay';
import AppHeader from '@/components/layout/AppHeader';
import ConnectionBanner from '@/components/layout/ConnectionBanner';
import GameMenu from '@/components/layout/GameMenu';
import Lobby from '@/components/Lobby/Lobby';
import Results from '@/components/Results/Results';
import StateCard from '@/components/StateCard/StateCard';
import { Coin } from '@/components/ui/Brand';
import Button, { buttonClass } from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Icon from '@/components/ui/Icon';
import { useConnectionState } from '@/hooks/useConnectionState';
import { useTableAvatars } from '@/hooks/useTableAvatars';
import { useWakeLock } from '@/hooks/useWakeLock';
import { getALobby, removeAPlayer } from '@/services/services';
import { RootState } from '@/store/store';
import { Game, Player, step } from '@/types/gameType';

// Styles
import styles from '../styles/game.module.css';

// Steps during which the active player still has to act (roll or lock).
const PLAYING_STEPS: step[] = [step.none, step.dices, step.lockAnimation];

interface LoadError {
  notFound: boolean;
  message?: string;
}

export default function GamePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const announce = useAnnounce();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const lobby = useSelector((state: RootState) => state.game.game);
  const me = useSelector(getMe);
  const user = useSelector(getUser);
  const avatars = useTableAvatars();

  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [howToOpen, setHowToOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  // > 0 while the heart-break of our own elimination plays.
  const [deathKey, setDeathKey] = useState(0);

  // Counts the realtime updates, so that a slower refetch never overwrites a newer state.
  const pusherEvents = useRef(0);
  const currentId = useRef(id);
  currentId.current = id;
  const chatPanelId = useId();
  const chatToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof id !== 'string') {
      setLoadError({ notFound: true });
      return;
    }
    setLoadError(null);

    const fetchLobby = async () => {
      try {
        // Also needed when landing here directly mid-game (refresh, shared
        // link): <Lobby /> - which otherwise loads the user - isn't mounted then.
        const user = getStoredUser();
        if (user) dispatch(setUser(user));

        const eventsBefore = pusherEvents.current;
        const { game, me, serverTime } = await getALobby(id, user);
        // Ignores the network latency, a fraction of a second at worst:
        // plenty for a countdown in seconds.
        dispatch(setClockOffset(serverTime - Date.now()));
        // `me` first, so that <Lobby /> never sees the game without knowing
        // whether we're already in it (it would try to join again).
        dispatch(setMe(me));
        // A realtime update that arrived meanwhile is newer than this answer.
        if (pusherEvents.current === eventsBefore) dispatch(setGame(game));
      } catch (error) {
        console.error('Erreur lors de la récupération du lobby :', error);
        const message = (error as Error).message;
        setLoadError({ notFound: /Aucun Lobby/i.test(message), message });
      }
    };
    fetchLobby();

    // Subscribe to the channel
    const channelName = `DollarCanadien-${id}`;
    const channel = getPusher().subscribe(channelName);

    const handleUpdatePlayers = (data: Player[]) => {
      pusherEvents.current += 1;
      dispatch(updatePlayers(data));
    };
    const handleUpdateGame = (data: Game) => {
      pusherEvents.current += 1;
      dispatch(setGame(data));
    };

    channel.bind('updatePlayers', handleUpdatePlayers);
    channel.bind('updateGame', handleUpdateGame);

    // `lobby` is deliberately NOT a dependency here: it changes on every
    // Pusher event (each dispatch above replaces it), so including it would
    // re-run this effect on every single update, re-subscribing and
    // re-binding without ever unbinding the previous handlers - each new
    // event would then fire all previously stacked handlers, dispatching
    // the same update multiple times and getting worse every turn.
    return () => {
      channel.unbind('updatePlayers', handleUpdatePlayers);
      channel.unbind('updateGame', handleUpdateGame);
      getPusher().unsubscribe(channelName);
    };
  }, [dispatch, id, router.isReady, attempt]);

  /**
   * Fetches the game again, e.g. after a phone woke up or the connection
   * came back (missed realtime events aren't replayed). Dropped if a newer
   * realtime update arrived meanwhile, or if the page changed.
   */
  const resync = useCallback(async () => {
    if (!id) return;
    const eventsBefore = pusherEvents.current;
    try {
      const { game, me, serverTime } = await getALobby(id, getStoredUser());
      if (pusherEvents.current !== eventsBefore || currentId.current !== id) return;
      dispatch(setClockOffset(serverTime - Date.now()));
      dispatch(setMe(me));
      dispatch(setGame(game));
    } catch {
      // The connection banner (or the next update) tells the rest.
    }
  }, [dispatch, id]);

  const connection = useConnectionState();
  const connectedOnce = useRef(false);
  useEffect(() => {
    if (connection !== 'connected') return;
    if (!connectedOnce.current) {
      connectedOnce.current = true;
      return;
    }
    resync();
  }, [connection, resync]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      clearTimeout(timer);
      timer = setTimeout(resync, 400);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(timer);
    };
  }, [resync]);

  const ready = !!lobby && lobby._id === id && !loadError;
  const players = ready ? lobby.players : [];
  const myPlayer = players.find((player) => player._id === me);
  const isPlayer = !!myPlayer;
  const running = ready && !!lobby.actif && lobby.step !== step.gameEnd;
  const isMyTurn = running && lobby.actif === me && PLAYING_STEPS.includes(lobby.step);

  const chat = useChat(ready ? lobby._id : null, user, me);
  const setChatOpen = chat.setOpen;

  // The chat folds away when our turn starts (the draft is kept).
  const wasMyTurn = useRef(false);
  useEffect(() => {
    if (isMyTurn && !wasMyTurn.current) setChatOpen(false);
    wasMyTurn.current = isMyTurn;
  }, [isMyTurn, setChatOpen]);

  // A sleeping phone misses its turn: keep the screen on while playing.
  useWakeLock(running && isPlayer);

  // Remembered for "Retourne à ta partie" on the home page.
  useEffect(() => {
    if (!ready || !isPlayer) return;
    setLastGameId(lobby.step === step.gameEnd ? null : lobby._id);
  }, [ready, isPlayer, lobby?.step, lobby?._id]);

  const leave = () => {
    if (ready && !lobby.actif && myPlayer && user) {
      // Leaving the lobby frees our seat.
      removeAPlayer(user, lobby._id, myPlayer._id).catch(console.error);
      router.push('/');
      return;
    }
    // During a turn's reveal, always ask: skipping the question would give
    // away our own death before it's shown.
    if (running && myPlayer && (myPlayer.hp > 0 || lobby.step === step.scoreAdditionAnimation)) {
      setLeaveOpen(true);
      return;
    }
    router.push('/');
  };

  const closeChat = () => {
    chat.setOpen(false);
    chatToggleRef.current?.focus();
  };

  // Tab title: what's going on, at a glance (even from another tab).
  const activePlayer = ready ? players.find((player) => player._id === lobby.actif) : undefined;
  const title = loadError
    ? 'Partie introuvable'
    : !ready
      ? 'Chargement…'
      : !lobby.actif
        ? `Salon de ${lobby.host.username}`
        : lobby.step === step.gameEnd
          ? `${getRanking(lobby)[0]?.username ?? 'Quelqu’un'} a gagné !`
          : isMyTurn
            ? '🎲 À toi !'
            : `${activePlayer?.username ?? '…'} joue`;

  // (Not on the results: the stake card there already says it.)
  const stake = ready && lobby.stake?.text && lobby.step !== step.gameEnd ? lobby.stake : null;

  let content;
  if (loadError) {
    content = loadError.notFound ? (
      <StateCard
        tone="error"
        title="Cette partie n'existe plus"
        actions={
          <>
            <Link href="/" className={buttonClass({ variant: 'primary', size: 'lg' })}>
              Créer une partie
            </Link>
          </>
        }
      >
        <p>Le lien est peut-être incomplet, ou la partie a expiré (elles disparaissent après 24 h sans jeu).</p>
      </StateCard>
    ) : (
      <StateCard
        tone="error"
        title="Impossible de charger la partie"
        actions={
          <>
            <Button variant="primary" icon="refresh" onClick={() => setAttempt((count) => count + 1)}>
              Réessayer
            </Button>
            <Link href="/" className={buttonClass({ variant: 'quiet' })}>
              Accueil
            </Link>
          </>
        }
      >
        <p>Vérifie ta connexion, puis réessaie.</p>
      </StateCard>
    );
  } else if (!ready) {
    content = (
      <div className={styles.loading} role="status">
        <span className={styles.loadingCoin} aria-hidden="true">
          <Coin size={56} />
        </span>
        <p>Chargement de la table…</p>
      </div>
    );
  } else if (!lobby.actif) {
    content = <Lobby onResync={resync} />;
  } else if (lobby.step === step.gameEnd) {
    content = <Results />;
  } else {
    content = <Board onResync={resync} onMyDeath={() => setDeathKey((key) => key + 1)} />;
  }

  return (
    <>
      <Head>
        <title>{`${title} · Dollar Canadien`}</title>
      </Head>
      <AppHeader
        onLeave={leave}
        center={
          stake && (
            <p className={styles.stake}>
              <Icon name="target" size={18} />
              <span className={styles.stakeWho}>{STAKE_TARGET_LABELS[stake.target]} devra :</span>
              <strong className={styles.stakeWhat}>{stake.text}</strong>
            </p>
          )
        }
        actions={
          <>
            {ready && <ChatToggle ref={chatToggleRef} chat={chat} panelId={chatPanelId} />}
            <GameMenu
              onHowToPlay={() => setHowToOpen(true)}
              onLeave={leave}
              leaveLabel={ready && !lobby.actif && isPlayer ? 'Quitter le salon' : "Retour à l'accueil"}
            />
          </>
        }
      />
      <main id="contenu" className={styles.main} tabIndex={-1}>
        {content}
      </main>

      {ready && (
        <ChatPanel
          chat={chat}
          panelId={chatPanelId}
          me={me}
          players={players}
          avatars={avatars}
          isPlayer={isPlayer}
          onClose={closeChat}
        />
      )}
      <ConnectionBanner />
      {deathKey > 0 && <DeathOverlay key={deathKey} onDone={() => setDeathKey(0)} />}

      <Dialog open={howToOpen} onClose={() => setHowToOpen(false)} title="Comment jouer">
        <HowToPlay variant="compact" maxHp={ready ? lobby.maxHp : undefined} />
      </Dialog>

      <Dialog
        size="sm"
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title="Quitter la partie ?"
        actions={
          <>
            <Button
              variant="quiet"
              onClick={() => {
                setLeaveOpen(false);
                announce('Tu as quitté la table.');
                router.push('/');
              }}
            >
              Quitter quand même
            </Button>
            <Button variant="primary" data-autofocus onClick={() => setLeaveOpen(false)}>
              Rester
            </Button>
          </>
        }
      >
        <p>
          Tu restes dans la partie : tes tours se joueront seuls (tes dés seront gardés automatiquement
          au bout de 45 s). Reviens avec le même lien pour reprendre.
        </p>
      </Dialog>
    </>
  );
}
