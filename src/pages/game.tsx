import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setClockOffset, setMe, setUser } from '@/store/slices/clientSlice';
import { setGame, updatePlayers } from '@/store/slices/gameSlice';

import { getStoredUser } from '@/functions/functions';
import { getPusher } from '../functions/pusher';

import Board from '@/components/Board/Board';
import Chat from '@/components/Chat/Chat';
import Lobby from '@/components/Lobby/Lobby';
import { getALobby } from '@/services/services';
import { RootState } from '@/store/store';
import { Game, Player, step } from '@/types/gameType';

// Styles
import styles from '../styles/game.module.css';
import Results from '@/components/Results/Results';

export default function GamePage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const id = router.query.id;
  const lobby = useSelector((state: RootState) => state.game.game);

  useEffect(() => {
    if (typeof id !== 'string') {
      console.error("Problème avec l'idRoom", id);
      return;
    }

    const fetchLobby = async () => {
      try {
        // Also needed when landing here directly mid-game (refresh, shared
        // link): <Lobby /> - which otherwise loads the user - isn't mounted then.
        const user = getStoredUser();
        if (user) dispatch(setUser(user));

        const { game, me, serverTime } = await getALobby(id, user);
        // Ignores the network latency, a fraction of a second at worst:
        // plenty for a countdown in seconds.
        dispatch(setClockOffset(serverTime - Date.now()));
        // `me` first, so that <Lobby /> never sees the game without knowing
        // whether we're already in it (it would try to join again).
        dispatch(setMe(me));
        dispatch(setGame(game));
      } catch (error) {
        console.error('Erreur lors de la récupération du lobby :', error);
        // TODO : Mettre un message d'erreur utilisateur ici et une redirection
      }
    };
    fetchLobby();

    // Subscribe to the channel
    const channelName = `DollarCanadien-${id}`;
    const channel = getPusher().subscribe(channelName);

    const handleUpdatePlayers = (data: Player[]) => {
      dispatch(updatePlayers(data));
    };
    const handleUpdateGame = (data: Game) => {
      dispatch(setGame(data));
    };

    channel.bind('updatePlayers', handleUpdatePlayers);
    channel.bind('updateGame', handleUpdateGame);

    // `lobby` is deliberately NOT a dependency here: it changes on every
    // Pusher event (each dispatch above replaces it), so including it would
    // re-run this effect on every single update, re-subscribing and
    // re-binding without ever unbinding the previous handlers - each new
    // event would then fire all previously stacked handlers, dispatching
    // the same update multiple times and getting worse every turn.
    return () => {
      channel.unbind('updatePlayers', handleUpdatePlayers);
      channel.unbind('updateGame', handleUpdateGame);
      getPusher().unsubscribe(channelName);
    };
  }, [dispatch, id]);

  return (
    <div className={styles.gamePage}>
      {/* TODO faire/séparer ça en un vrai header */}
      <Link className={styles.homeBtn} href="/">
        Dollar Canadien 🍁
      </Link>
      {/* TODO faire un mode "multi local" pour quand les gens jouent en soirée en mode jeu d'alcool */}
      {!lobby?.actif && <Lobby />}
      {lobby?.actif && lobby.step !== step.gameEnd && <Board />}
      {lobby?.actif && lobby.step === step.gameEnd && <Results />}
      {lobby && <Chat gameId={lobby._id} />}
    </div>
  );
}
