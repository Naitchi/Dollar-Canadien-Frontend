import styles from './home.module.css';
import axios from 'axios';

export default function Home() {
  const redirection = () => {
    const randomId = 'id' + Math.random().toString(16).slice(2);
    window.location.href = `game?room=${randomId}`;
  };
  return (
    <div>
      <body>
        <h1 className={styles.title}>Dollar Canadien 🍁</h1>
        <p className={styles.desc}>
          Dollar Canadien qu&apos;est ce que c&apos;est ? C&apos;est un jeu avec un nombre de joueur
          illimité ou il faut lancer des dés et GLHF
        </p>
        <button onClick={redirection} id="newRoom">
          Create a room →
        </button>
      </body>
    </div>
  );
}
