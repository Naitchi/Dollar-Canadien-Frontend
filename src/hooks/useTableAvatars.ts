import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Avatar, assignAvatars } from '@/functions/game';
import { RootState } from '@/store/store';

/** Avatars of everyone at the current table, keyed by username (see assignAvatars). */
export const useTableAvatars = (): Record<string, Avatar> => {
  const players = useSelector((state: RootState) => state.game.game?.players);
  const namesKey = (players ?? []).map((player) => player.username).join('\u0000');
  return useMemo(() => assignAvatars(namesKey ? namesKey.split('\u0000') : []), [namesKey]);
};
