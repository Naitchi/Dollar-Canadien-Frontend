import { ChatMessage, Game, Player, StakeTarget, User } from '@/types/gameType';

/**
 * Reads the user saved in localStorage on a previous visit.
 *
 * @returns {User | null} The stored user, or null if there is none (or it's unreadable).
 */
export const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

/**
 * Copies the current page URL to the clipboard.
 *
 * @returns {void} This function does not return anything.
 */
export const copyToClipboard = (): void => {
  navigator.clipboard.writeText(window.location.href);
};

/**
 * Computes the whole seconds left before a deadline, according to the server's clock.
 *
 * @param {string} deadline - The ISO deadline sent by the server.
 * @param {number} clockOffset - Server clock minus ours, in milliseconds.
 * @returns {number} The seconds left, never negative.
 */
export const secondsLeft = (deadline: string, clockOffset: number): number =>
  Math.max(Math.ceil((new Date(deadline).getTime() - (Date.now() + clockOffset)) / 1000), 0);

// Heartbeat: very slow as long as the player has CALM_HP or more, then
// faster and faster down to PANIC_BEAT_S when (almost) dead. Durations of one
// beat, in seconds.
const CALM_HP = 20;
const CALM_BEAT_S = 1.6;
const PANIC_BEAT_S = 0.35;

/**
 * Duration of one heartbeat for a given amount of HP.
 *
 * @param {number} hp - The player's HP.
 * @param {number} maxHp - The HP the game started with (a game starting
 * under CALM_HP still starts with a calm heart).
 * @returns {number} The beat duration, in seconds.
 */
export const beatDuration = (hp: number, maxHp: number): number => {
  const calmHp = Math.max(Math.min(CALM_HP, maxHp), 1);
  const ratio = Math.min(Math.max(hp / calmHp, 0), 1);
  return PANIC_BEAT_S + (CALM_BEAT_S - PANIC_BEAT_S) * ratio;
};

// At or under this many HP, the screen edges turn red.
export const LOW_HP = 10;

/**
 * How strong the red "about to die" screen edges are.
 *
 * @param {number} hp - The player's HP.
 * @returns {number} 0 (none) above LOW_HP or once dead, up to 1 at 1 HP.
 */
export const lowHealthIntensity = (hp: number): number => {
  if (hp <= 0 || hp > LOW_HP) return 0;
  // Already clearly visible at LOW_HP, strongest at 1 HP.
  return 0.35 + (0.65 * (LOW_HP - hp)) / (LOW_HP - 1);
};

/**
 * Final ranking of a game: the winner first, then the players in reverse
 * order of elimination, so the first loser comes last.
 *
 * @param {Game} game - The game.
 * @returns {Player[]} The players, from first to last place.
 */
export const getRanking = (game: Game): Player[] => {
  const byId = new Map(game.players.map((player) => [player._id, player]));
  const eliminated = (game.eliminated ?? [])
    .map((id) => byId.get(id))
    .filter((player): player is Player => !!player)
    .reverse();
  const alive = game.players.filter((player) => player.hp > 0).sort((a, b) => b.hp - a.hp);
  // Dead players missing from `eliminated` (games from before it existed).
  const others = game.players.filter((player) => player.hp <= 0 && !eliminated.includes(player));
  return [...alive, ...others, ...eliminated];
};

export const STAKE_TARGET_LABELS: Record<StakeTarget, string> = {
  firstLoser: 'Le premier perdant',
  losers: 'Les perdants',
  winner: 'Le gagnant',
};

/**
 * Players who have to do the stake, given the final ranking.
 *
 * @param {StakeTarget} target - Who the stake is for.
 * @param {Player[]} ranking - The final ranking (see getRanking).
 * @returns {Player[]} The players concerned.
 */
export const stakeBearers = (target: StakeTarget, ranking: Player[]): Player[] => {
  if (ranking.length === 0) return [];
  if (target === 'winner') return ranking.slice(0, 1);
  if (target === 'losers') return ranking.slice(1);
  return ranking.length > 1 ? ranking.slice(-1) : [];
};

// Chat messages kept in memory at most (the chat is ephemeral anyway).
const MAX_CHAT_MESSAGES = 100;

/**
 * Adds a chat message, unless we already have it (our own messages arrive
 * twice: from our request and from Pusher).
 *
 * @param {ChatMessage[]} messages - The messages so far.
 * @param {ChatMessage} message - The new message.
 * @returns {ChatMessage[]} The messages, oldest first, at most MAX_CHAT_MESSAGES.
 */
export const appendMessage = (messages: ChatMessage[], message: ChatMessage): ChatMessage[] =>
  messages.some((existing) => existing.id === message.id)
    ? messages
    : [...messages, message].slice(-MAX_CHAT_MESSAGES);

/**
 * A color for a player's name in the chat, always the same for the same player.
 *
 * @param {string} playerId - The player's public id.
 * @returns {string} A CSS color, light enough to read on the dark background.
 */
export const playerColor = (playerId: string): string => {
  let hash = 0;
  for (const char of playerId) hash = (hash * 31 + char.charCodeAt(0)) % 100_000;
  // Golden angle: ids that differ by one character still get far apart hues.
  const hue = Math.round((hash * 137.508) % 360);
  return `hsl(${hue}, 70%, 72%)`;
};

/**
 * A player as they should be displayed while the result of a turn is being
 * animated: the server applies the damage as soon as the turn is resolved,
 * but the HP should only drop when the damage pops up on screen.
 *
 * @param {Player} player - The player, with their HP already updated by the server.
 * @param {Record<string, number>} hpBefore - Everyone's HP before the turn was resolved.
 * @param {boolean} hideNewHp - True until the damage has popped up.
 * @returns {Player} The player, with the HP to display.
 */
export const withDisplayedHp = (
  player: Player,
  hpBefore: Record<string, number>,
  hideNewHp: boolean,
): Player => {
  const before = hpBefore[player._id];
  return hideNewHp && before !== undefined && before !== player.hp ? { ...player, hp: before } : player;
};
