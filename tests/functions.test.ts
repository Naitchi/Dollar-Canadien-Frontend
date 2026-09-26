import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  appendMessage,
  beatDuration,
  getRanking,
  lowHealthIntensity,
  playerColor,
  secondsLeft,
  stakeBearers,
  withDisplayedHp,
} from '@/functions/functions';
import { ChatMessage, Game, Player, step } from '@/types/gameType';

const NOW = new Date('2026-01-01T12:00:00.000Z').getTime();
const inMs = (ms: number) => new Date(NOW + ms).toISOString();

describe('secondsLeft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts the whole seconds left, rounding up', () => {
    expect(secondsLeft(inMs(45_000), 0)).toBe(45);
    expect(secondsLeft(inMs(44_100), 0)).toBe(45);
    expect(secondsLeft(inMs(900), 0)).toBe(1);
  });

  it('never goes below zero once the deadline has passed', () => {
    expect(secondsLeft(inMs(0), 0)).toBe(0);
    expect(secondsLeft(inMs(-10_000), 0)).toBe(0);
  });

  it("uses the server's clock: 30 s left even if ours is 10 s behind", () => {
    // Our clock is 10 s behind the server's: offset = server - ours = +10 s.
    // The server set the deadline 30 s after ITS now, i.e. 40 s after ours.
    expect(secondsLeft(inMs(40_000), 10_000)).toBe(30);
  });
});

describe('beatDuration', () => {
  it('beats very slowly as long as the player has 20 HP or more', () => {
    const calm = beatDuration(30, 30);
    expect(calm).toBeCloseTo(1.6);
    expect(beatDuration(25, 30)).toBeCloseTo(calm);
    expect(beatDuration(20, 30)).toBeCloseTo(calm);
    expect(beatDuration(80, 100)).toBeCloseTo(calm);
  });

  it('beats faster and faster under 20 HP', () => {
    const at19 = beatDuration(19, 30);
    const at10 = beatDuration(10, 30);
    const at1 = beatDuration(1, 30);
    expect(at19).toBeLessThan(beatDuration(20, 30));
    expect(at10).toBeLessThan(at19);
    expect(at1).toBeLessThan(at10);
    expect(at1).toBeGreaterThan(0.3);
  });

  it('starts calm even in a game starting under 20 HP', () => {
    expect(beatDuration(10, 10)).toBeCloseTo(beatDuration(30, 30));
  });

  it('stays within bounds below zero', () => {
    expect(beatDuration(-5, 30)).toBeCloseTo(beatDuration(0, 30));
  });
});

describe('lowHealthIntensity', () => {
  it('shows nothing above 10 HP, nor once dead', () => {
    expect(lowHealthIntensity(30)).toBe(0);
    expect(lowHealthIntensity(11)).toBe(0);
    expect(lowHealthIntensity(0)).toBe(0);
    expect(lowHealthIntensity(-3)).toBe(0);
  });

  it('is already visible at 10 HP and strongest at 1 HP', () => {
    expect(lowHealthIntensity(10)).toBeGreaterThan(0.3);
    expect(lowHealthIntensity(5)).toBeGreaterThan(lowHealthIntensity(10));
    expect(lowHealthIntensity(1)).toBeCloseTo(1);
  });
});

const makePlayer = (id: string, hp: number): Player => ({
  _id: id,
  index: 0,
  username: id,
  ready: true,
  hp,
  dices: [],
  lockedDices: [],
  attackDices: [],
});

const endedGame = (players: Player[], eliminated: string[]): Game => ({
  _id: 'game',
  private: true,
  maxHp: 30,
  maxPlayers: 8,
  host: { id: 'a', username: 'a' },
  actif: 'a',
  step: step.gameEnd,
  turnDeadline: null,
  stake: { target: 'firstLoser', text: '' },
  eliminated,
  players,
});

describe('getRanking', () => {
  it('puts the winner first, then the players in reverse order of elimination', () => {
    const game = endedGame(
      [makePlayer('a', 12), makePlayer('b', -3), makePlayer('c', 0), makePlayer('d', -8)],
      ['d', 'b', 'c'],
    );
    expect(getRanking(game).map((player) => player._id)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('still ranks dead players missing from the elimination list (older games)', () => {
    const game = endedGame([makePlayer('a', 12), makePlayer('b', -3)], []);
    expect(getRanking(game).map((player) => player._id)).toEqual(['a', 'b']);
  });
});

describe('stakeBearers', () => {
  const ranking = ['winner', 'second', 'firstLoser'].map((id) => makePlayer(id, 0));
  const ids = (players: Player[]) => players.map((player) => player._id);

  it('designates the first loser (last in the ranking)', () => {
    expect(ids(stakeBearers('firstLoser', ranking))).toEqual(['firstLoser']);
  });

  it('designates every loser', () => {
    expect(ids(stakeBearers('losers', ranking))).toEqual(['second', 'firstLoser']);
  });

  it('designates the winner', () => {
    expect(ids(stakeBearers('winner', ranking))).toEqual(['winner']);
  });

  it('designates nobody without players', () => {
    expect(stakeBearers('firstLoser', [])).toEqual([]);
  });
});

const chatMessage = (id: string): ChatMessage => ({
  id,
  playerId: 'pub-bob',
  username: 'Bob',
  text: `message ${id}`,
  sentAt: '2026-01-01T12:00:00.000Z',
});

describe('appendMessage', () => {
  it('adds the message at the end', () => {
    const messages = appendMessage([chatMessage('1')], chatMessage('2'));
    expect(messages.map((message) => message.id)).toEqual(['1', '2']);
  });

  it('ignores a message we already have (our own ones arrive twice)', () => {
    const messages = [chatMessage('1')];
    expect(appendMessage(messages, chatMessage('1'))).toBe(messages);
  });

  it('only keeps the latest 100 messages', () => {
    let messages: ChatMessage[] = [];
    for (let i = 0; i < 105; i++) messages = appendMessage(messages, chatMessage(String(i)));
    expect(messages).toHaveLength(100);
    expect(messages[0].id).toBe('5');
  });
});

describe('playerColor', () => {
  it('always gives the same color to the same player', () => {
    expect(playerColor('pub-bob')).toBe(playerColor('pub-bob'));
  });

  it('usually gives different players different colors', () => {
    expect(playerColor('pub-bob')).not.toBe(playerColor('pub-alice'));
  });

  it('gives clearly different hues to ids that differ by a single character', () => {
    const hue = (id: string) => Number(playerColor(id).match(/hsl\((\d+)/)![1]);
    const gap = Math.abs(hue('p2') - hue('p3'));
    expect(Math.min(gap, 360 - gap)).toBeGreaterThan(60);
  });
});

describe('withDisplayedHp', () => {
  const bob = { ...makePlayer('bob', 21) };
  const hpBefore = { bob: 30 };

  it('keeps showing the HP from before while the damage has not popped up', () => {
    expect(withDisplayedHp(bob, hpBefore, true).hp).toBe(30);
  });

  it('shows the new HP once the damage has popped up', () => {
    expect(withDisplayedHp(bob, hpBefore, false)).toBe(bob);
  });

  it('shows the HP as they are for a player we have no previous HP for (page just loaded)', () => {
    expect(withDisplayedHp(bob, {}, true)).toBe(bob);
  });

  it('does not touch a player whose HP did not change', () => {
    const alice = makePlayer('alice', 12);
    expect(withDisplayedHp(alice, { alice: 12 }, true)).toBe(alice);
  });
});
