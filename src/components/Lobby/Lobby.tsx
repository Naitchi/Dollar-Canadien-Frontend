import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Store
import { RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { setGame } from '@/store/slices/gameSlice';
import {
  addAPlayer,
  changeOptions,
  changeReadyStatus,
  removeAPlayer,
  startAGame,
} from '@/services/services';

// Components
import UsernameModal from '../UsernameModal/UsernameModal';

// Functions
import { getPlayerById } from '@/functions/functions';

// Style
import styles from './Lobby.module.css';
import { setUser } from '@/store/slices/clientSlice';

interface State {
  user: {
    id: string;
    username: string;
  };
  showUsernameModal: boolean;
}

const Lobby = () => {
  // Variables
  const dispatch = useDispatch();
  const [state, setState] = useState<State>({
    user: {
      username: '',
      id: '',
    },
    showUsernameModal: false,
  });
  const [showCopyNotif, setShowCopyNotif] = useState(false);

  const lobby = useSelector((state: RootState) => state.game.game);

  const isHost = lobby?.host?.id === state.user.id;

  // TODO faire un input en mode le label : Enjeu: (un select) "le premier perdant"| "les perdants" | "le gagant", devera `l'input`
  // et ensuite on l'affiche a la fin avec les noms a la place de "le premier perdant" etc.

  // useEffects
  useEffect(() => {
    // TODO on pourrait faire un loading la pendant qu'on cherche le username dans le localStorage et avant d'afficher le salon/la modal un fois qu'on a la réponse/les données des autres joueurs
    const userFromStorage = localStorage.getItem('user');
    if (!userFromStorage) {
      setState((state) => ({ ...state, showUsernameModal: true }));
    } else {
      setState((state) => ({ ...state, user: JSON.parse(userFromStorage) }));
      dispatch(setUser(JSON.parse(userFromStorage)));
    }
    // TODO Mettre le loading en OFF
  }, [dispatch]);

  useEffect(() => {
    const getGameAfterAddPlayer = async () => {
      try {
        if (lobby?._id) {
          const game = await addAPlayer(state.user, lobby._id);
          if (game) dispatch(setGame(game));
        } else {
          console.error('ID de lobby manquant');
        }
      } catch (error) {
        console.error('Error adding player:', error);
      }
    };
    if (lobby && state.user.id && getPlayerById(lobby, state.user) === -1) {
      getGameAfterAddPlayer();
    }
  }, [state.user, lobby, dispatch]);

  // Remove the player from the lobby when they close/leave the tab while
  // still in the pre-game lobby (not during an active game - this effect
  // only lives for as long as <Lobby /> is mounted, i.e. before `actif` is
  // set on the game).
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!lobby || !state.user.id) return;
      const index = getPlayerById(lobby, state.user);
      if (index === -1) return;
      removeAPlayer(state.user, lobby._id, index);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lobby, state.user]);

  // Methods
  const handleUsernameSubmit = (username: string): void => {
    const user = { username, id: uuidv4() };
    localStorage.setItem('user', JSON.stringify(user));
    setState((state) => ({ ...state, user, showUsernameModal: false }));
    dispatch(setUser(user));
  };

  const changeOptionsHandler = (options: {
    private?: boolean;
    maxHp?: number;
    maxPlayers?: number;
  }) => {
    if (!lobby) return;
    changeOptions(state.user, lobby._id, {
      private: options.private ?? lobby.private,
      maxHp: options.maxHp ?? lobby.maxHp,
      maxPlayers: options.maxPlayers ?? lobby.maxPlayers,
    });
  };

  const quit = () => {
    if (!lobby) return;
    const index = getPlayerById(lobby, state.user);
    if (index === -1) return;
    removeAPlayer(state.user, lobby._id, index);
  };

  const toggleReady = () => {
    if (lobby) console.log(changeReadyStatus(state.user, lobby._id));
  };

  const startGame = async () => {
    if (lobby) console.log(startAGame(state.user, lobby._id));
  };

  return !state.user.username ? (
    <UsernameModal isOpen={state.showUsernameModal} onSubmit={handleUsernameSubmit} />
  ) : (
    <div>
      {/** TODO quand on ferme la page du lobby retirer le joueur de la partie || ne pas rajouter le meme joueur si il est deja dans la game */}
      {/** TODO changer pour qu'il n'y ai que l'host qui puisse modifie avec propriete disable */}
      <button onClick={quit}>Quitter la partie</button>
      <div id="rules">
        <div className="rule">
          <label htmlFor="privacy">Rendre la partie privé:</label>
          {/* TODO rendre ca en slider*/}
          <input
            disabled={!isHost}
            checked={!!lobby?.private}
            type="checkbox"
            id="privacy"
            onChange={(e) => changeOptionsHandler({ private: e.target.checked })}
          />
        </div>
        <div className="rule">
          <label htmlFor="maxHp">Point de vie de depart:</label>
          <input
            disabled={!isHost}
            value={lobby?.maxHp}
            type="number"
            id="maxHp"
            onChange={(e) => changeOptionsHandler({ maxHp: Number(e.target.value) })}
          />
        </div>
        <div className="rule">
          <label htmlFor="maxPlayers">Nombre de joueurs maximum dans le salon :</label>
          <input
            disabled={!isHost}
            value={lobby?.maxPlayers}
            type="number"
            id="maxPlayers"
            onChange={(e) => changeOptionsHandler({ maxPlayers: Number(e.target.value) })}
          />
        </div>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(window.location.href);
          setShowCopyNotif(true);
          setTimeout(() => setShowCopyNotif(false), 2000);
        }}
        className={styles.copyLinkButton}
      >
        {showCopyNotif ? 'Lien copié !' : "Copier le lien d'invitation du lobby"}
      </button>
      <div id="players">
        {lobby?.players.map((player, index) => {
          const isPlayerHost = player._id === lobby?.host?.id;
          return (
            <div className={styles.playerDiv} key={'player' + index}>
              <p>{player.username}</p>
              {isPlayerHost ? (
                <div>👑</div>
              ) : (
                <button
                  onClick={player._id === state.user.id ? toggleReady : undefined}
                  disabled={player._id !== state.user.id}
                >
                  {/* TODO rajouter un hover qui met l'inverse de l'état actuel */}
                  {player.ready ? 'Prêt' : 'Pas prêt'}
                </button>
              )}
            </div>
          );
        })}
        {/* TODO faire un bouton pour le host pour exclure */}
        {/* TODO pour ca il faut aussi interdire de rerejoindre via l'ip ou un truc comme ca, ou alors changer l'id de la game et rediriger le reste de la room */}
      </div>
      {isHost ? <button onClick={startGame}>Start Game</button> : <p>En attente de l&apos;host</p>}
    </div>
  );
};

export default Lobby;
