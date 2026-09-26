export interface Player {
  // Public id: safe to show and compare (`actif`, `host.id` and `me` use it too).
  _id: string;
  index: number;
  username: string;
  ready: boolean;
  hp: number;
  lockedDices: null | number[];
  dices: null | number[];
  attackDices: number[][];
}

export interface Game {
  _id: string;
  // Always true for now: games are only reachable through their invite link.
  private: boolean;
  maxHp: number;
  maxPlayers: number;
  host: {
    id: string;
    username: string;
  };
  actif: string | null;
  step: step;
  // ISO date after which any player can unblock the turn (see turnTimeout).
  turnDeadline: string | null;
  // What the target(s) will have to do at the end of the game (empty: nothing).
  stake: Stake;
  // Public ids of the eliminated players, in order: the first one is the first loser.
  eliminated: string[];
  players: Player[];
}

export interface User {
  // PRIVATE secret generated on first visit and kept in localStorage. It's
  // what proves to the server who we are: it's only ever sent to our own
  // backend, never shown, and never received back from it.
  id: string;
  username: string;
}

// A chat message, as broadcast by the server (never stored: see Chat.tsx).
export interface ChatMessage {
  id: string;
  // Public id and username of the author.
  playerId: string;
  username: string;
  text: string;
  // ISO date.
  sentAt: string;
}

// What the backend answers when we create, join or fetch a lobby: the game
// and `me`, our own public player id in it (null if we're not in it).
export interface LobbyResponse {
  game: Game;
  me: string | null;
}

export enum step {
  none = 'none',
  dicesAnimation = 'dicesAnimation',
  dices = 'dices',
  lockAnimation = 'lockAnimation',
  scoreAdditionAnimation = 'scoreAdditionAnimation',
  attack = 'attack', // TODO peut-etre avoir plus ici en mode "showAttackNumber" qui apparait au milieu de l'écran et se place en haut a droite ou gauche
  damage = 'damage', // TODO genre pareil que score addition mais c'est une multiplication entre le nombre d'attaque et le nombre de fois qu'on la eu
  gameEnd = 'gameEnd',
} // TODO en faire un autre pour quand ça sélectionne la victime en mode ça compte un par un
// TODO faire une animation quand un joueur meurt en mode on le voit en plus grand et son coeur casse idk a la maniere d'undertale

export type StakeTarget = 'firstLoser' | 'losers' | 'winner';

export interface Stake {
  target: StakeTarget;
  text: string;
}

export interface Options {
  maxHp: number;
  maxPlayers: number;
  stake?: Stake;
}
