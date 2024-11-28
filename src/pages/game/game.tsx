import { useEffect, useState } from 'react';
import styles from './game.module.css';
import axios from 'axios';
import { showResult, checkUsername } from '../../functions/functions';
import Pusher from 'pusher-js';

export default function Home() {
  const [username, setUsername] = useState<string|null>();
  setUsername(localStorage.getItem('username'));
  const urlParams = new URLSearchParams(window.location.search);
  const idRoom = urlParams.get('room');

  // Extraction de l'ID de l'URL et connexion au Channel
  let channel = null;
  if (idRoom) {
    channel = pusher.subscribe(`DollarCanadien-${idRoom}`);
    console.log('Salon trouvé');
  } else alert('Aucun id trouvé dans l"url');

  // Config Pusher
  Pusher.logToConsole = true;
  const pusher = new Pusher('46c45f5e0f237306de38', {
    cluster: 'eu',
    forceTLS: true,
  });

  pusher.connection.bind('connected', () => {
    checkUsername(username, idRoom, usernameBox, chatBox, loadingBox, link);
  });

  // Handle received dices
  channel.bind('dicesResults', (data) => {
    showResult(data.dices, dicesBox);
  });

  return (
    <div>
      <div>
        <h1 className={styles.title}>
          <a href="/">Dollar Canadien</a>
        </h1>
        <button id="copy">
          → Copier le lien <span className="responsive"> d&apos;invitation</span> ←
        </button>
      </div>
      <p id="box_loading">Chargement du salon de la partie...</p>
      
      <button id="test">Roll the dices</button>
      <div id="dicesBox">{}</div>
    </div>
  );
}
