import { useState } from 'react';
import styles from './UsernameModal.module.css';
import axios from 'axios';

export default function UsernameModal() {
  const [inputValue, setInputValue] = useState<string | null>();

  const newUsername = () => {
    if (!inputValue) return; // TODO afficher une erreur dans ce cas
    const data: string = inputValue.trim();
    if (data.length > 0) {
      localStorage.setItem('username', inputValue.trim());
      setUsername(data); // mettre le pseudo dans un store pour se les partager
    }
  };

  return (
    <div id="box_username" className="hide">
      <label htmlFor="username" className={styles.label_username}>
        Pour rentrer dans la partie il vous faut un nom d&apos;utilisateur:
      </label>
      <input placeholder="Votre pseudo" type="text" name="unsername" id="username" />
      <button onClick={newUsername} id="validation">
        Validé
      </button>
    </div>
  );
}
