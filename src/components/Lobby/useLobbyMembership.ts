import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

// Functions
import { getStoredUser } from '@/functions/functions';

// Services
import { addAPlayer, removeAPlayer } from '@/services/services';

// Store
import { getMe, setMe, setUser } from '@/store/slices/clientSlice';
import { setGame } from '@/store/slices/gameSlice';
import { RootState } from '@/store/store';

// Types
import { User } from '@/types/gameType';

/**
 * Being in the lobby: who we are (the user saved on this device, or a
 * username to ask for), joining the lobby automatically, and leaving it when
 * the tab is closed.
 */
export const useLobbyMembership = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const lobby = useSelector((state: RootState) => state.game.game);
  // Our public id in this game (null until we've joined it).
  const me = useSelector(getMe);

  const [user, setLocalUser] = useState<User>({ id: '', username: '' });
  const [askUsername, setAskUsername] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const joiningRef = useRef(false);

  useEffect(() => {
    // TODO on pourrait faire un loading la pendant qu'on cherche le username dans le localStorage et avant d'afficher le salon/la modal un fois qu'on a la réponse/les données des autres joueurs
    const storedUser = getStoredUser();
    if (!storedUser) {
      setAskUsername(true);
    } else {
      setLocalUser(storedUser);
      dispatch(setUser(storedUser));
    }
    // TODO Mettre le loading en OFF
  }, [dispatch]);

  // Join the lobby once we know who we are, unless we're already in it
  // (`me` comes from the server, see game.tsx). The server ignores a second
  // join from the same player anyway, the ref just avoids sending one. The id
  // check skips a previous game still in the store while this one loads.
  useEffect(() => {
    if (!lobby || lobby._id !== router.query.id) return;
    if (!user.id || me || joiningRef.current || joinError) return;

    joiningRef.current = true;
    addAPlayer(user, lobby._id)
      .then(({ game, me }) => {
        dispatch(setMe(me));
        dispatch(setGame(game));
      })
      .catch((error: Error) => {
        console.error('Error adding player:', error);
        setJoinError(error.message);
      })
      .finally(() => {
        joiningRef.current = false;
      });
  }, [user, lobby, me, joinError, dispatch, router.query.id]);

  // Remove the player from the lobby when they close/leave the tab while
  // still in the pre-game lobby (not during an active game - this effect
  // only lives for as long as <Lobby /> is mounted, i.e. before `actif` is
  // set on the game).
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!lobby || !user.id || !me) return;
      removeAPlayer(user, lobby._id, me).catch(console.error);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lobby, user, me]);

  const submitUsername = (username: string): void => {
    const newUser = { username, id: uuidv4() };
    localStorage.setItem('user', JSON.stringify(newUser));
    setLocalUser(newUser);
    setAskUsername(false);
    dispatch(setUser(newUser));
  };

  return { user, askUsername, submitUsername, joinError };
};
