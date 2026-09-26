import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import Modal from '@/components/Modal/Modal';
import UsernameModal from '@/components/UsernameModal/UsernameModal';

import { createALobby } from '@/services/services';
import { setMe, setUser } from '@/store/slices/clientSlice';
import { setGame } from '@/store/slices/gameSlice';

import styles from '../styles/index.module.css';

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [state, setState] = useState({
    showJoinModal: false,
    showUsernameModal: false,
    joinInput: '',
    user: {
      id: '',
      username: '',
    },
  });

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user');
    if (!userFromStorage) {
      setState((state) => ({ ...state, showUsernameModal: true }));
      return;
    }
    setState((state) => ({ ...state, user: JSON.parse(userFromStorage) }));
  }, []);

  const handleUsernameSubmit = (username: string): void => {
    const user = { username, id: uuidv4() };
    localStorage.setItem('user', JSON.stringify(user));
    setState((state) => ({ ...state, user, showUsernameModal: false }));
    dispatch(setUser(user));
  };

  const toggleJoinModal = () => {
    setState((state) => ({ ...state, showJoinModal: !state.showJoinModal }));
  };

  const joinInputChange = (value: string): void => {
    setState((state) => ({ ...state, joinInput: value }));
  };

  // Accepts either a full invite link (as copied from the lobby's "Copier le
  // lien" button, e.g. http://localhost:3000/game?id=XYZ) or a bare lobby id.
  const extractLobbyId = (input: string): string => {
    const trimmed = input.trim();
    try {
      const url = new URL(trimmed);
      return url.searchParams.get('id') || trimmed;
    } catch {
      return trimmed;
    }
  };

  const joinLobby = () => {
    const lobbyId = extractLobbyId(state.joinInput);
    if (!lobbyId) return;

    const user =
      state.user.username && state.user.id
        ? state.user
        : { username: state.user.username || 'puiguin', id: state.user.id || uuidv4() };

    localStorage.setItem('user', JSON.stringify(user));
    dispatch(setUser(user));
    router.push(`/game?id=${lobbyId}`);
  };

  const createLobby = async () => {
    if (!state.user.id) {
      if (!state.user.username) {
        setState((state) => ({ ...state, user: { username: 'puiguin', id: uuidv4() } }));
        localStorage.setItem('user', JSON.stringify(state.user));
      }
      setState((state) => ({ ...state, user: { ...state.user, id: uuidv4() } }));
      localStorage.setItem('user', JSON.stringify({ username: state.user.username, id: uuidv4() }));
    }

    if (state.user.username && state.user.id) {
      localStorage.setItem('user', JSON.stringify(state.user));

      dispatch(setUser(state.user));

      try {
        const { game, me } = await createALobby(state.user);
        dispatch(setMe(me));
        dispatch(setGame(game));
        router.push(`/game?id=${game._id}`);
      } catch (error) {
        console.error('Erreur lors de la création du lobby :', error);
      }
    }
  };

  return (
    // TODO faire un div à coté comme on fait dans le board avec une icone d'utilisateur et le pseudo
    <div className={styles.container}>
      <h1 className={styles.title}>Dollar Canadien 🍁</h1>
      <UsernameModal isOpen={state.showUsernameModal} onSubmit={handleUsernameSubmit} />
      {/* Toutes les parties sont privées (accessibles uniquement par lien) pour l'instant. */}
      <button onClick={createLobby} className={styles.button} aria-label="Créer une partie">
        Créer une partie →
      </button>
      <button
        onClick={toggleJoinModal}
        className={styles.button}
        aria-label="Rejoindre une partie "
      >
        Rejoindre une partie →
      </button>
      <Modal isOpen={state.showJoinModal} isClosable={true} onClose={toggleJoinModal}>
        <div className={styles.modalContent}>
          <label htmlFor="joinInput" className={styles.label}>
            Lien ou code de la partie
          </label>
          <input
            id="joinInput"
            type="text"
            onChange={(e) => joinInputChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinLobby()}
            placeholder="Colle le lien d'invitation ou le code du salon"
            className={styles.input}
          />
          <button onClick={joinLobby} className={styles.button}>
            Rejoindre
          </button>
        </div>
      </Modal>
      {/* TODO faire un carouselle ? */}
      <div className={styles.description}>
        <p>
          <span className={styles.emphasis}>Dollar Canadien</span> est un jeu de dés où
          l&apos;objectif est simple :{' '}
          <span className={styles.emphasis}>Sois le dernier à tenir debout!</span>&nbsp;🎲💥
        </p>
        <p>
          Chaque joueur commence avec <span className={styles.emphasis}>30 points de vie</span>.
        </p>
        <ul className={styles.ruleslist}>
          <li>
            Tu lances <span className={styles.emphasis}>6 dés</span> et gardes au moins{' '}
            <span className={styles.emphasis}>1 dé</span> à chaque lancer, jusqu&apos;à ce
            qu&apos;il n&apos;en reste plus.
          </li>
          <li>
            Si la somme est <span className={styles.emphasis}>faible (moins de 30)</span> : tu perds
            ce nombre en HP.&nbsp;😬
          </li>
          <li>
            Si tu fais un <span className={styles.emphasis}>gros score (30 ou plus)</span> : la
            différence devient ton <span className={styles.emphasis}>arme d&apos;attaque</span>
            {''}!&nbsp;⚔️
          </li>
        </ul>
        <p>
          Tu choisis un adversaire et relances les dés pour essayer de faire tomber ton{' '}
          <span className={styles.emphasis}>chiffre d&apos;attaque</span>. Plus tu réussis, plus tu
          infliges de dégâts!&nbsp;💥
        </p>
        <p className={styles.emphasis}>Alors, tu te sens chanceux&nbsp;?&nbsp;🍀</p>
      </div>
    </div>
  );
}
