import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Store
import { RootState } from '@/store/store';
import { useDispatch, useSelector } from 'react-redux';
import { setGame } from '@/store/slices/gameSlice';
import { addAPlayer, changeReadyStatus, startAGame } from '@/services/services';

// Components
import Modal from '../Modal/Modal';

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
  usernameInput: string | null;
  isModalOpen: boolean;
}

const Lobby = () => {
  // Variables
  const dispatch = useDispatch();
  const [state, setState] = useState<State>({
    user: {
      username: '',
      id: '',
    },
    usernameInput: null,
    isModalOpen: false,
  });

  const lobby = useSelector((state: RootState) => state.game.game);

  // TODO faire un input en mode le label : Enjeu: (un select) "le premier perdant"| "les perdants" | "le gagant", devera `l'input`
  // et ensuite on l'affiche a la fin avec les noms a la place de "le premier perdant" etc.

  // useEffects
  useEffect(() => {
    // TODO on pourrait faire un loading la pendant qu'on cherche le username dans le localStorage et avant d'afficher le salon/la modal un fois qu'on a la réponse/les données des autres joueurs
    const userFromStorage = localStorage.getItem('user');
    if (!userFromStorage) {
      setState((state) => ({ ...state, isModalOpen: true }));
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

  // Methods
  const toggleModal = () => setState({ ...state, isModalOpen: !state.isModalOpen });
  const usernameValidate = (): void => {
    if (!state.usernameInput) return;
    const user = {
      username: state.usernameInput,
      id: uuidv4(),
    };
    localStorage.setItem('user', JSON.stringify(user));
    setState({ ...state, user: user });
    console.log(user);
    dispatch(setUser(user));
  };

  // TODO check ça ? existe pas dans ce composent non ? plutôt dans l'index
  const usernameChange = (usernameInput: string): void => {
    setState({ ...state, usernameInput: usernameInput });
    console.log(state.user);
    dispatch(setUser(state.user));
  };

  // const togglePrivacy = () => {
  //   // TODO faire ce service encore
  // };

  const toggleReady = () => {
    if (lobby) console.log(changeReadyStatus(state.user, lobby._id));
  };

  const startGame = async () => {
    if (lobby) console.log(startAGame(state.user, lobby._id));
  };

  return !state.user.username ? (
    <Modal isOpen={state.isModalOpen} isClosable={false} onClose={toggleModal}>
      <div className={styles.modalContent}>
        <label htmlFor="username" className={styles.label}>
          Quel est votre pseudonyme ?
        </label>
        <input
          id="username"
          type="text"
          onChange={(e) => usernameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && usernameValidate()}
          placeholder="Entrez votre pseudonyme"
          className={styles.input}
        />
        <button onClick={usernameValidate} className={styles.button}>
          Valider
        </button>
      </div>
    </Modal>
  ) : (
    <div>
      {/* Pas encore de service pour ça */}
      {/* <div id="rules">
        <div className="rule">
          <label htmlFor="privacy">Rendre la partie privé:</label>
          <input
            value={lobby?.private.toString()}
            type="checkbox"
            id="privacy"
            onClick={togglePrivacy}
          />
        </div>
      </div> */}
      {/* TODO faire un bouton pour copier le lien du lobby */}
      <div id="players">
        {lobby?.players.map((player, index) => {
          return (
            <div className={styles.playerDiv} key={'player' + index}>
              <p>{player.username}</p>
              {player._id === lobby.host.id ? (
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
      </div>
      {/*TODO Rajouter un bouton/condition la qui dépends de si t'es l'host t'as startgame et sinon t'as un bouton ready (je préfère cette idée à l'actuelle)*/}
      {<button onClick={startGame}>Start Game</button>}
    </div>
  );
};

export default Lobby;
