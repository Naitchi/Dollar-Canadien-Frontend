import { Game, User } from '@/types/gameType';

/**
 * Finds the index of a player in a game based on their ID and username.
 *
 * @param {Game} game - The game object containing a list of players.
 * @param {User} user - The user object to search for within the game's players.
 * @returns {number} The index of the player in the game's players array, or -1 if not found.
 */
export const getPlayerById = (game: Game, user: User): number => {
  return game.players.findIndex(
    (player) => player._id === user.id && player.username === user.username,
  );
};

/**
 * Copies the current page URL to the clipboard.
 *
 * @returns {void} This function does not return anything.
 */
export const copyToClipboard = (): void => {
  navigator.clipboard.writeText(window.location.href);
};
