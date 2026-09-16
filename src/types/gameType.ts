export interface Player {
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
  private: boolean;
  maxHp: number;
  maxPlayers: number;
  host: {
    id: string;
    username: string;
  };
  actif: string | null;
  step: step;
  players: Player[];
}

export interface User {
  id: string;
  username: string;
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

export interface Options {
  maxHp: number;
  maxPlayers: number;
  private: boolean;
}
