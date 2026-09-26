import { useRef, useState } from 'react';
import { useRouter } from 'next/router';

// Store
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';
import { getMe } from '@/store/slices/clientSlice';

// Services
import {
  changeOptions,
  changeReadyStatus,
  removeAPlayer,
  startAGame,
} from '@/services/services';

// Components
import UsernameModal from '../UsernameModal/UsernameModal';
import InviteLink from './InviteLink';
import PlayerList from './PlayerList';
import RulesCard, { OptionsChange } from './RulesCard';

// Hooks
import { useLobbyMembership } from './useLobbyMembership';

// Style
import styles from './Lobby.module.css';

const Lobby = () => {
  const router = useRouter();
  const lobby = useSelector((state: RootState) => state.game.game);
  // Our public id in this game (null until we've joined it).
  const me = useSelector(getMe);
  const { user, askUsername, submitUsername, joinError } = useLobbyMembership();

  const [optionsError, setOptionsError] = useState<string | null>(null);
  // The last options change sent to the server (see startGame).
  const pendingOptionsSave = useRef<Promise<void> | null>(null);

  const isHost = !!me && lobby?.host?.id === me;
  const players = lobby?.players ?? [];
  const meAsPlayer = players.find((player) => player._id === me);
  const enoughPlayers = players.length >= 2;
  const everyoneReady = players.every((player) => player.ready || player._id === lobby?.host?.id);
  const canStart = isHost && enoughPlayers && everyoneReady;

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
    if (lobby) changeReadyStatus(user, lobby._id).catch(console.error);
  };

  const startGame = async () => {
    if (!lobby) return;
    // The stake field saves when it loses focus, which happens right before
    // this click: wait for that save, options can't change once the game has started.
    await pendingOptionsSave.current;
    startAGame(user, lobby._id);
  };

  const status = isHost
    ? !enoughPlayers
      ? 'Il faut au moins 2 joueurs pour lancer la partie.'
      : !everyoneReady
        ? 'En attente que tout le monde soit prêt…'
        : 'Tout le monde est prêt !'
    : "En attente de l'host pour lancer la partie…";

  return !user.username ? (
    <UsernameModal isOpen={askUsername} onSubmit={submitUsername} />
  ) : (
    <div className={styles.lobby}>
      {joinError && <p className={styles.error}>Impossible de rejoindre la partie : {joinError}</p>}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.title}>Salon</h2>
          <span className={styles.count}>
            {players.length} / {lobby?.maxPlayers} joueurs
          </span>
        </div>
        <InviteLink />
        <PlayerList
          players={players}
          hostId={lobby?.host?.id}
          me={me}
          canKick={isHost}
          onKick={kick}
        />
      </section>

      {lobby && (
        <RulesCard
          lobby={lobby}
          isHost={isHost}
          error={isHost ? optionsError : null}
          onChange={changeLobbyOptions}
        />
      )}

      <div className={styles.actions}>
        <button onClick={quit} className={styles.quitButton}>
          Quitter la partie
        </button>
        {isHost ? (
          <button onClick={startGame} className={styles.primaryButton} disabled={!canStart}>
            Lancer la partie
          </button>
        ) : (
          meAsPlayer && (
            <button
              onClick={toggleReady}
              className={meAsPlayer.ready ? styles.secondaryButton : styles.primaryButton}
            >
              {meAsPlayer.ready ? 'Finalement pas prêt' : 'Je suis prêt'}
            </button>
          )
        )}
      </div>
      <p className={styles.status}>{status}</p>
    </div>
  );
};

export default Lobby;
