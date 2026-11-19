import { describe, expect, it } from 'vitest';

import {
  ANIMALS,
  assignAvatars,
  avatarFor,
  dangerThreshold,
  dieShortcutIndex,
  extractLobbyId,
  hpChanges,
  hpRatio,
  isInDanger,
  lastTurnScore,
  looksLikeLobbyId,
  nextPlayerId,
  ordinal,
  outcomeFor,
  outcomeText,
  projectionHint,
  railOrder,
  shownHp,
  stakeSubject,
  turnProjection,
} from '@/functions/game';
import { Player } from '@/types/gameType';

const player = (id: string, hp: number, extra: Partial<Player> = {}): Player => ({
  _id: id,
  index: 0,
  username: id,
  ready: true,
  hp,
  lockedDices: [],
  dices: [],
  attackDices: [],
  ...extra,
});

describe('avatars', () => {
  it('gives the same avatar to the same name, whatever its case or spaces', () => {
    expect(avatarFor('Bob')).toEqual(avatarFor('  bob '));
  });

  it('never gives the same animal twice at a table (while there are enough)', () => {
    const names = Array.from({ length: 20 }, (_, i) => `joueur${i}`);
    const avatars = assignAvatars(names);
    const animals = names.map((name) => avatars[name].animal);
    expect(new Set(animals).size).toBe(names.length);
  });

  it('does not depend on the join order', () => {
    const names = ['Gaston', 'Martine', 'puiguin', 'TestUser', 'Jo'];
    expect(assignAvatars(names)).toEqual(assignAvatars([...names].reverse()));
  });

  it('still gives everyone an avatar with more players than animals', () => {
    const names = Array.from({ length: 99 }, (_, i) => `p${i}`);
    const avatars = assignAvatars(names);
    expect(Object.keys(avatars)).toHaveLength(99);
    expect(names.every((name) => ANIMALS.includes(avatars[name].animal as never))).toBe(true);
  });
});

describe('health', () => {
  it('never shows negative HP', () => {
    expect(shownHp(-4)).toBe(0);
    expect(shownHp(12)).toBe(12);
  });

  it('uses 10 PV as the danger threshold in a default game', () => {
    expect(dangerThreshold(30)).toBe(10);
    expect(isInDanger(10, 30)).toBe(true);
    expect(isInDanger(11, 30)).toBe(false);
  });

  it('caps the threshold to a third of the starting HP in tiny games', () => {
    expect(dangerThreshold(9)).toBe(3);
    expect(isInDanger(5, 9)).toBe(false);
    expect(dangerThreshold(1)).toBe(1);
  });

  it('is never in danger at full health or once dead', () => {
    expect(isInDanger(1, 1)).toBe(false);
    expect(isInDanger(0, 30)).toBe(false);
    expect(isInDanger(-3, 30)).toBe(false);
  });

  it('computes the HP bar ratio, clamped', () => {
    expect(hpRatio(15, 30)).toBe(0.5);
    expect(hpRatio(-5, 30)).toBe(0);
    expect(hpRatio(40, 30)).toBe(1);
  });
});

describe('outcomes', () => {
  it('follows the server rules around 30', () => {
    expect(outcomeFor(21)).toEqual({ kind: 'damage', amount: 9 });
    expect(outcomeFor(30)).toEqual({ kind: 'even' });
    expect(outcomeFor(34)).toEqual({ kind: 'attack', attackNumber: 4 });
  });

  it('describes them in French', () => {
    expect(outcomeText(28)).toBe('28 : −2 PV');
    expect(outcomeText(30)).toBe('Pile 30 : rien ne se passe');
    expect(outcomeText(31)).toBe('31 : attaque de 1');
  });
});

describe('turnProjection', () => {
  it('sums locked and selected dice by index', () => {
    const projection = turnProjection([6, 5], [1, 4, 6, 3], [1, 2]);
    expect(projection.lockedSum).toBe(11);
    expect(projection.selectedSum).toBe(10);
    expect(projection.total).toBe(21);
    expect(projection.remainingAfter).toBe(2);
    expect(projection.min).toBe(23);
    expect(projection.max).toBe(33);
    expect(projection.isFinal).toBe(false);
    expect(projection.outcome).toBeNull();
  });

  it('knows when the lock completes the 6 dice', () => {
    const projection = turnProjection([6, 6, 5, 6], [3, 4], [0, 1]);
    expect(projection.isFinal).toBe(true);
    expect(projection.total).toBe(30);
    expect(projection.outcome).toEqual({ kind: 'even' });
  });

  it('ignores out-of-range indexes', () => {
    expect(turnProjection([], [2, 3], [0, 5]).selectedSum).toBe(2);
  });

  it('gives a hint only when it changes something', () => {
    expect(projectionHint(turnProjection([], [1, 2, 3, 4, 5, 6], []))).toBeNull();
    expect(projectionHint(turnProjection([], [1, 2, 3, 4, 5, 6], [5]))).toBeNull();
    expect(projectionHint(turnProjection([1, 1, 1], [1, 2, 2], [0]))).toBe(
      "30 n'est plus atteignable (max 16)",
    );
    expect(projectionHint(turnProjection([6, 6, 6, 6], [6, 1], [0]))).toBe('Plus de 30 assuré (min 31)');
    expect(projectionHint(turnProjection([6, 6, 6, 6, 6], [4], [0]))).toBe('34 : attaque de 4');
  });
});

describe('nextPlayerId', () => {
  const players = [player('a', 10), player('b', 0), player('c', 5), player('d', 7)];

  it('skips dead players, in seat order, wrapping around', () => {
    expect(nextPlayerId(players, 'a')).toBe('c');
    expect(nextPlayerId(players, 'd')).toBe('a');
  });

  it('works when the active player just died', () => {
    const afterDeath = [player('a', 10), player('b', 0), player('c', 5)];
    expect(nextPlayerId(afterDeath, 'b')).toBe('c');
  });

  it('returns null when only one player is left', () => {
    expect(nextPlayerId([player('a', 3), player('b', 0)], 'a')).toBeNull();
    expect(nextPlayerId(players, null)).toBeNull();
  });
});

describe('hpChanges', () => {
  it('names who lost HP, never counting below 0', () => {
    const changes = hpChanges({ a: 30, b: 6, c: 12 }, [player('a', 30), player('b', -4), player('c', 4)]);
    expect(changes.map((change) => [change.player._id, change.lost, change.ko])).toEqual([
      ['c', 8, false],
      ['b', 6, true],
    ]);
  });
});

describe('railOrder & lastTurnScore', () => {
  it('puts eliminated players at the bottom, keeping seat order', () => {
    const order = railOrder([player('a', 0), player('b', 4), player('c', 9), player('d', -2)]);
    expect(order.map((p) => p._id)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('sums the last 6 locked dice only', () => {
    expect(lastTurnScore(player('a', 9, { lockedDices: [6, 6, 5, 4, 2, 1] }))).toBe(24);
    expect(lastTurnScore(player('a', 9, { lockedDices: [6, 6] }))).toBeNull();
  });
});

describe('extractLobbyId', () => {
  it('accepts an invite link or a bare id', () => {
    expect(extractLobbyId('http://localhost:3000/game?id=abc')).toBe('abc');
    expect(extractLobbyId('  abc  ')).toBe('abc');
  });

  it('recognises the shape of a lobby id', () => {
    expect(looksLikeLobbyId('MockLobbyId0123456789A')).toBe(true);
    expect(looksLikeLobbyId('nope')).toBe(false);
  });
});

describe('dieShortcutIndex', () => {
  it('maps 1-6 to die indexes', () => {
    expect(dieShortcutIndex({ key: '1' })).toBe(0);
    expect(dieShortcutIndex({ key: '6' })).toBe(5);
    expect(dieShortcutIndex({ key: '7' })).toBeNull();
    expect(dieShortcutIndex({ key: ' ' })).toBeNull();
  });

  it('ignores text fields, modifiers and held keys', () => {
    expect(dieShortcutIndex({ key: '3', target: { tagName: 'INPUT' } })).toBeNull();
    expect(dieShortcutIndex({ key: '3', ctrlKey: true })).toBeNull();
    expect(dieShortcutIndex({ key: '3', repeat: true })).toBeNull();
    expect(dieShortcutIndex({ key: '3', target: { tagName: 'BUTTON' } })).toBe(2);
  });
});

describe('stakeSubject', () => {
  it('agrees the verb with who has to do the stake', () => {
    expect(stakeSubject([], true)).toBe('Tu dois');
    expect(stakeSubject(['Gaston'], false)).toBe('Gaston doit');
    expect(stakeSubject(['Gaston', 'Jo'], false)).toBe('Gaston et Jo doivent');
    expect(stakeSubject(['Gaston', 'Jo'], true)).toBe('Gaston, Jo et toi devez');
    expect(stakeSubject(['Gaston', 'Jo', 'Martine'], false)).toBe('Gaston, Jo et Martine doivent');
  });
});

describe('ordinal', () => {
  it('writes French ordinals', () => {
    expect(ordinal(1)).toBe('1er');
    expect(ordinal(3)).toBe('3e');
  });
});
