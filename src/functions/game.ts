import { LOW_HP } from './functions';
import { Player } from '@/types/gameType';

// Pure game-display helpers, shared by the board, the lobby, the results and
// the chat. Everything here is derived from the data the server sends: no
// invented numbers.

// ---------------------------------------------------------------------------
// Avatars
// ---------------------------------------------------------------------------

// Emoji 12 or older only (newer ones show as empty boxes on older phones).
export const ANIMALS = [
  '🦊', '🐻', '🦝', '🐺', '🦉', '🦆', '🐸', '🐧',
  '🦔', '🦦', '🐿️', '🦌', '🦞', '🐢', '🐙', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐵', '🐔', '🐰',
  '🐱', '🐶', '🐳', '🦄', '🐝', '🐞', '🦜', '🦩',
] as const;

// The reference's tile colours (Canadian flat palette). Ink outlines on top.
export const TILES = [
  '#ff9f43', '#54a0ff', '#ffd32a', '#ff7675',
  '#2ed573', '#a29bfe', '#48dbfb', '#fd79a8',
] as const;

export interface Avatar {
  animal: string;
  tile: string;
}

/** FNV-1a: a small, stable string hash (same result on every device). */
export const hashString = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

/** Names are compared trimmed and lowercased: "Bob" and "bob " are the same friend. */
export const normalizeName = (name: string): string => name.trim().toLowerCase();

/**
 * The avatar a name gets on its own (no clash resolution): what the name
 * field previews while typing.
 */
export const avatarFor = (name: string): Avatar => {
  const hash = hashString(normalizeName(name));
  return { animal: ANIMALS[hash % ANIMALS.length], tile: TILES[(hash >>> 8) % TILES.length] };
};

/**
 * Avatars of everyone at a table. Two players never share an animal (while
 * there are enough animals): clashes are resolved in alphabetical order of
 * the names, never in join order, so nothing reshuffles while a game is
 * running (its roster is fixed).
 *
 * @param {string[]} names - The in-game usernames.
 * @returns {Record<string, Avatar>} The avatar of each name (keyed by the name as given).
 */
export const assignAvatars = (names: string[]): Record<string, Avatar> => {
  const sorted = [...names].sort((a, b) => {
    const left = normalizeName(a);
    const right = normalizeName(b);
    return left < right ? -1 : left > right ? 1 : a < b ? -1 : a > b ? 1 : 0;
  });
  const taken = new Set<number>();
  const result: Record<string, Avatar> = {};
  for (const name of sorted) {
    if (taken.size >= ANIMALS.length) taken.clear(); // more players than animals
    const hash = hashString(normalizeName(name));
    let index = hash % ANIMALS.length;
    while (taken.has(index)) index = (index + 1) % ANIMALS.length;
    taken.add(index);
    result[name] = { animal: ANIMALS[index], tile: TILES[(hash >>> 8) % TILES.length] };
  }
  return result;
};

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

/** HP as shown: never below 0 (the server can go negative on the last hit). */
export const shownHp = (hp: number): number => Math.max(0, hp);

/**
 * At or under this many HP, a player is in danger. Damage is absolute (a bad
 * turn costs up to 24 PV), so the threshold is LOW_HP, but capped to a third
 * of the starting HP so that tiny games don't start in danger.
 */
export const dangerThreshold = (maxHp: number): number =>
  Math.max(1, Math.min(LOW_HP, Math.floor(maxHp / 3)));

/** Whether a player is alive, hurt and close to death (badge, red edges, announcements). */
export const isInDanger = (hp: number, maxHp: number): boolean =>
  hp > 0 && hp < maxHp && hp <= dangerThreshold(maxHp);

/** Share of the starting HP left, between 0 and 1 (for the HP bar). */
export const hpRatio = (hp: number, maxHp: number): number =>
  maxHp > 0 ? Math.min(Math.max(hp / maxHp, 0), 1) : 0;

// ---------------------------------------------------------------------------
// Turn
// ---------------------------------------------------------------------------

export const TARGET_SCORE = 30;
export const DICE_PER_TURN = 6;

export type Outcome =
  | { kind: 'damage'; amount: number }
  | { kind: 'even' }
  | { kind: 'attack'; attackNumber: number };

/** What a final score of 6 dice does (server rules, backend/functions/turn.js). */
export const outcomeFor = (score: number): Outcome => {
  if (score < TARGET_SCORE) return { kind: 'damage', amount: TARGET_SCORE - score };
  if (score === TARGET_SCORE) return { kind: 'even' };
  return { kind: 'attack', attackNumber: score - TARGET_SCORE };
};

export interface TurnProjection {
  lockedSum: number;
  selectedSum: number;
  // Locked + selected.
  total: number;
  lockedCount: number;
  selectedCount: number;
  // Dice still to throw after this lock.
  remainingAfter: number;
  // Lowest and highest final score still possible after this lock.
  min: number;
  max: number;
  // This lock completes the 6 dice: the score is final.
  isFinal: boolean;
  outcome: Outcome | null;
}

/**
 * Where the active player's turn stands, with the dice currently selected.
 * Selection is by index in `dices`, like the server's lock.
 */
export const turnProjection = (
  locked: number[] | null | undefined,
  dices: number[] | null | undefined,
  selected: number[],
): TurnProjection => {
  const lockedDice = locked ?? [];
  const thrown = dices ?? [];
  const picked = selected.filter((index) => index >= 0 && index < thrown.length);
  const lockedSum = lockedDice.reduce((sum, value) => sum + value, 0);
  const selectedSum = picked.reduce((sum, index) => sum + thrown[index], 0);
  const total = lockedSum + selectedSum;
  const remainingAfter = Math.max(DICE_PER_TURN - lockedDice.length - picked.length, 0);
  const isFinal = lockedDice.length + picked.length >= DICE_PER_TURN;
  return {
    lockedSum,
    selectedSum,
    total,
    lockedCount: lockedDice.length,
    selectedCount: picked.length,
    remainingAfter,
    min: total + remainingAfter,
    max: total + remainingAfter * 6,
    isFinal,
    outcome: isFinal ? outcomeFor(total) : null,
  };
};

/** One line describing an outcome, for people (and screen readers). */
export const outcomeText = (score: number): string => {
  const outcome = outcomeFor(score);
  if (outcome.kind === 'damage') return `${score} : −${outcome.amount} PV`;
  if (outcome.kind === 'even') return 'Pile 30 : rien ne se passe';
  return `${score} : attaque de ${outcome.attackNumber}`;
};

/**
 * Helper line under the main button: the verdict of the last lock, or a
 * warning when 30 can no longer be reached (or is guaranteed). Null when
 * there is nothing useful to say.
 */
export const projectionHint = (projection: TurnProjection): string | null => {
  if (projection.selectedCount === 0) return null;
  if (projection.isFinal) return outcomeText(projection.total);
  if (projection.max < TARGET_SCORE) return `30 n'est plus atteignable (max ${projection.max})`;
  if (projection.min > TARGET_SCORE) return `Plus de 30 assuré (min ${projection.min})`;
  return null;
};

/**
 * Who plays after the active player: the next alive player in seat order,
 * exactly like the server (getNextPlayerId). Null when the game is about to end.
 */
export const nextPlayerId = (players: Player[], activeId: string | null): string | null => {
  if (!activeId) return null;
  if (players.filter((player) => player.hp > 0).length <= 1) return null;
  const candidates = players.filter((player) => player.hp > 0 || player._id === activeId);
  const index = candidates.findIndex((player) => player._id === activeId);
  if (index === -1) return null;
  const next = candidates[(index + 1) % candidates.length];
  return next._id === activeId ? null : next._id;
};

export interface HpChange {
  player: Player;
  // PV actually lost (never counts below 0).
  lost: number;
  // Fell to 0 or below during this change.
  ko: boolean;
}

/**
 * Who lost HP between two moments (named damage after a turn).
 *
 * @param {Record<string, number>} before - HP of each player id before.
 * @param {Player[]} players - The players now.
 * @returns {HpChange[]} The players who lost HP, biggest loss first.
 */
export const hpChanges = (before: Record<string, number>, players: Player[]): HpChange[] =>
  players
    .filter((player) => before[player._id] !== undefined)
    .map((player) => {
      const was = shownHp(before[player._id]);
      const now = shownHp(player.hp);
      return { player, lost: was - now, ko: was > 0 && now === 0 };
    })
    .filter((change) => change.lost > 0)
    .sort((a, b) => b.lost - a.lost);

/** Players for the side rail: seat order, eliminated players at the bottom. */
export const railOrder = (players: Player[]): Player[] => [
  ...players.filter((player) => player.hp > 0),
  ...players.filter((player) => player.hp <= 0),
];

/** Sum of a player's 6 locked dice from their last turn, or null. */
export const lastTurnScore = (player: Player): number | null =>
  player.lockedDices && player.lockedDices.length === DICE_PER_TURN
    ? player.lockedDices.reduce((sum, value) => sum + value, 0)
    : null;

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/**
 * Accepts either a full invite link (e.g. http://localhost:3000/game?id=XYZ)
 * or a bare lobby id.
 */
export const extractLobbyId = (input: string): string => {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('id') || trimmed;
  } catch {
    return trimmed;
  }
};

/** Same shape as the server's lobby ids (22 URL-safe characters). */
export const looksLikeLobbyId = (id: string): boolean => /^[A-Za-z0-9_-]{22}$/.test(id);

interface KeyLike {
  key: string;
  repeat?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  target?: unknown;
}

/**
 * Keyboard shortcut "1"–"6" to toggle a die. Only meant to be listened to on
 * the dice group itself (WCAG 2.1.4: active only while it has focus), and
 * ignored from text fields, with modifiers, and for held-down keys.
 *
 * @returns {number | null} The die index (0-5), or null when it isn't a shortcut.
 */
export const dieShortcutIndex = (event: KeyLike): number | null => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return null;
  const target = event.target as { tagName?: string; isContentEditable?: boolean } | null;
  const tag = target?.tagName?.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
    return null;
  }
  if (!/^[1-6]$/.test(event.key)) return null;
  return Number(event.key) - 1;
};

/** "1er", "2e", "3e"… */
export const ordinal = (rank: number): string => (rank === 1 ? '1er' : `${rank}e`);

/** "Gaston", "Gaston et Jo", "Gaston, Jo et Martine". */
export const joinNames = (names: string[]): string =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;

/**
 * Who has to do the stake, with the verb agreed in French: "Tu dois",
 * "Gaston doit", "Gaston et toi devez", "Gaston, Jo et Martine doivent".
 *
 * @param {string[]} others - The other players concerned (names).
 * @param {boolean} includesMe - Whether we're concerned too.
 * @returns {string} Subject and verb.
 */
export const stakeSubject = (others: string[], includesMe: boolean): string => {
  if (includesMe && others.length === 0) return 'Tu dois';
  if (includesMe) return `${joinNames([...others, 'toi'])} devez`;
  return `${joinNames(others)} ${others.length > 1 ? 'doivent' : 'doit'}`;
};
