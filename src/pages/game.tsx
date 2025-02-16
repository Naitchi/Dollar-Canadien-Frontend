import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setGame, updatePlayers } from '@/store/slices/gameSlice';

import { getPusher } from '../functions/pusher';

import Board from '@/components/Board/Board';
import Lobby from '@/components/Lobby/Lobby';
import { getALobby } from '@/services/services';
import { RootState } from '@/store/store';
import { Game, Player } from '@/types/gameType';

// Styles
import styles from '../styles/game.module.css';

export default function GamePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const id = router.query.id;
  const lobby = useSelector((state: RootState) => state.game.game);

  useEffect(() => {
    const fetchLobby = async () => {
      if (!lobby) {
        if (typeof id !== 'string') {
          console.error("Problème avec l'idRoom", id);
          return;
        }

        try {
          const game = await getALobby(id);
          if (game) {
            dispatch(setGame(game));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du lobby :', error);
          // TODO : Mettre un message d'erreur utilisateur ici et une redirection
        }
      }
    };
    fetchLobby();

    // Subscribe to the channel
    const channel = getPusher().subscribe(`DollarCanadien-${id}`);

    channel.bind('updatePlayers', (data: Player[]) => {
      dispatch(updatePlayers(data));
    });

    channel.bind('updateGame', (data: Game) => {
      console.log(data);

      dispatch(setGame(data));
    });
  }, [dispatch, id, lobby]);

  return (
    <div className={styles.gamePage}>
      {/* TODO faire/séparer ça en un vrai header */}
      <Link className={styles.homeBtn} href="/">
        Dollar Canadien 🍁
      </Link>
      {/* TODO faire un mode "multi local" pour quand les gens jouent en soirée en mode jeu d'alcool */}
      {!lobby?.actif && <Lobby />}
      {lobby?.actif && <Board />}
    </div>
  );
}
