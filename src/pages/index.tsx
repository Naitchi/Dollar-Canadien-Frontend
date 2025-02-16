import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import Modal from '@/components/Modal/Modal';

import { createALobby } from '@/services/services';
import { setUser } from '@/store/slices/clientSlice';
import { setGame } from '@/store/slices/gameSlice';

import styles from '../styles/index.module.css';

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [state, setState] = useState({
    showJoinModal: false,
    showCreateModal: false,
    showRenameModal: false,
    private: false,
    usernameInput: null,
    user: {
      id: '',
      username: '',
    },
  });

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user');
    if (!userFromStorage) return;

    setState((state) => ({ ...state, user: JSON.parse(userFromStorage) }));
  }, []);

  const toggleRenameModal = () => {
    setState((state) => ({ ...state, showCreateModal: !state.showRenameModal }));
  };

  const toggleCreateModal = () => {
    setState((state) => ({ ...state, showCreateModal: !state.showCreateModal }));
  };

  const toggleJoinModal = () => {
    setState((state) => ({ ...state, showJoinModal: !state.showJoinModal }));
  };

  const setPrivate = (boolean: boolean): void => {
    setState((state) => ({ ...state, private: boolean }));
  };

  // TODO c'est plus bon ça c''est user :{ username, id} mnt mais ça va surement sauté avec le mise en modal
  const usernameChange = (username: string): void => {
    setState({ ...state, user: { ...state.user, username: username } });
  };

  const usernameValidate = (): void => {
    if (!state.usernameInput) return;
    // TODO remettre une condition pour si il a déjà un id ou non
    const user = {
      username: state.usernameInput,
      id: uuidv4(),
    };
    localStorage.setItem('user', JSON.stringify(user));
    setState({ ...state, user: user });
    console.log(user);
    dispatch(setUser(user));
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

      const lobby = await createALobby(state.user, state.private);
      dispatch(setGame(lobby));
      router.push(`/game?id=${lobby._id}`);
    }
  };

  return (
    // TODO faire un div à coté comme on fait dans le board avec une icone d'utilisateur et le pseudo
    <div className={styles.container}>
      <h1 className={styles.title}>Dollar Canadien 🍁</h1>
      {/** TODO le remettre en modal */}
      <Modal isOpen={state.showRenameModal} isClosable={false} onClose={toggleRenameModal}>
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
      <button onClick={toggleCreateModal} className={styles.button} aria-label="Créer une partie">
        Créer une partie →
      </button>
      <Modal isOpen={state.showCreateModal} isClosable={true} onClose={toggleCreateModal}>
        <div className={styles.modalOverlay}>
          <div className={styles.privacy}>
            <p>Définir l&apos;accès de la partie :</p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setPrivate(true)}
                className={`${styles.modalButton} ${state.private ? styles.activated : ''}`}
              >
                Privé
              </button>
              <button
                onClick={() => setPrivate(false)}
                className={`${styles.modalButton} ${state.private ? '' : styles.activated}`}
              >
                Public
              </button>
            </div>
          </div>
          <button onClick={createLobby} className={styles.modalButton}>
            Créer
          </button>
        </div>
      </Modal>
      <button
        onClick={toggleJoinModal}
        className={styles.button}
        aria-label="Rejoindre une partie "
      >
        Rejoindre une partie →
      </button>
      <Modal isOpen={state.showJoinModal} isClosable={true} onClose={toggleJoinModal}>
        <div></div>
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
