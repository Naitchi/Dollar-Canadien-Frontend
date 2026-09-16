import { useState } from 'react';

// Components
import Modal from '../Modal/Modal';

// Styles
import styles from './UsernameModal.module.css';

interface UsernameModalProps {
  isOpen: boolean;
  onSubmit: (username: string) => void;
}

// Prompts for a username. Not closable - a user always needs one to play,
// whether it's their first visit to the site or they've joined a game link
// without ever having set one.
const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onSubmit }) => {
  const [usernameInput, setUsernameInput] = useState('');

  const validate = (): void => {
    const username = usernameInput.trim();
    if (!username) return;
    onSubmit(username);
    setUsernameInput('');
  };

  return (
    <Modal isOpen={isOpen} isClosable={false} onClose={() => {}}>
      <div className={styles.modalContent}>
        <label htmlFor="username" className={styles.label}>
          Quel est votre pseudonyme ?
        </label>
        <input
          id="username"
          type="text"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && validate()}
          placeholder="Entrez votre pseudonyme"
          className={styles.input}
        />
        <button onClick={validate} className={styles.button}>
          Valider
        </button>
      </div>
    </Modal>
  );
};

export default UsernameModal;
