import { describe, expect, it } from 'vitest';

import gameReducer, {
  removePlayer,
  selectActivePlayer,
  setGame,
  updatePlayer,
  updatePlayers,
} from '@/store/slices/gameSlice';
import { Game, Player, step } from '@/types/gameType';

// ---- Fixture helpers -------------------------------------------------

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    _id: 'p1',
    index: 0,
    username: 'Alice',
    ready: false,
    hp: 10,
    lockedDices: null,
    dices: null,
    attackDices: [],
    ...overrides,
  };
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    _id: 'game1',
    private: false,
    maxHp: 10,
    maxPlayers: 4,
    host: { id: 'host1', username: 'Host' },
    actif: null,
    step: step.none,
    players: [
      makePlayer({ _id: 'p1', index: 0, username: 'Alice', hp: 10 }),
      makePlayer({ _id: 'p2', index: 1, username: 'Bob', hp: 8 }),
      makePlayer({ _id: 'p3', index: 2, username: 'Carol', hp: 6 }),
    ],
    ...overrides,
  };
}

interface PusherStateLike {
  game: Game | null;
}

const emptyState: PusherStateLike = { game: null };

// ---- setGame -----------------------------------------------------------

describe('setGame', () => {
  it('sets the game from a null initial state', () => {
    const game = makeGame();
    const result = gameReducer(emptyState, setGame(game));
    expect(result.game).toEqual(game);
  });

  it('wholesale replaces an existing game rather than merging', () => {
    const originalGame = makeGame({ _id: 'original' });
    const newGame = makeGame({ _id: 'replacement', players: [makePlayer({ _id: 'onlyOne' })] });

    const result = gameReducer({ game: originalGame }, setGame(newGame));

    expect(result.game).toEqual(newGame);
    expect(result.game?._id).toBe('replacement');
    expect(result.game?.players).toHaveLength(1);
  });
});

// ---- updatePlayers -------------------------------------------------------

describe('updatePlayers', () => {
  it('replaces state.game.players with the payload when a game exists', () => {
    const game = makeGame();
    const newPlayers: Player[] = [makePlayer({ _id: 'newP1' }), makePlayer({ _id: 'newP2' })];

    const result = gameReducer({ game }, updatePlayers(newPlayers));

    expect(result.game?.players).toEqual(newPlayers);
  });

  it('is a no-op (state.game stays null) when state.game is null', () => {
    const newPlayers: Player[] = [makePlayer({ _id: 'newP1' })];

    const result = gameReducer(emptyState, updatePlayers(newPlayers));

    expect(result.game).toBeNull();
  });
});

// ---- removePlayer --------------------------------------------------------

describe('removePlayer', () => {
  it('filters out the player with the matching _id', () => {
    const game = makeGame();

    const result = gameReducer({ game }, removePlayer('p2'));

    expect(result.game?.players.map((p) => p._id)).toEqual(['p1', 'p3']);
  });

  it('is a no-op when the id does not match any player', () => {
    const game = makeGame();

    const result = gameReducer({ game }, removePlayer('doesNotExist'));

    expect(result.game?.players.map((p) => p._id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('does not throw and stays null when state.game is null', () => {
    expect(() => gameReducer(emptyState, removePlayer('p1'))).not.toThrow();
    const result = gameReducer(emptyState, removePlayer('p1'));
    expect(result.game).toBeNull();
  });
});

// ---- updatePlayer --------------------------------------------------------

describe('updatePlayer', () => {
  it('merges partial fields into the matching player at index 1, leaving others untouched', () => {
    const game = makeGame();

    const result = gameReducer({ game }, updatePlayer({ id: 'p2', hp: 1, ready: true }));

    expect(result.game?.players[1]).toEqual({
      ...makePlayer({ _id: 'p2', index: 1, username: 'Bob', hp: 8 }),
      hp: 1,
      ready: true,
    });
    // other players untouched
    expect(result.game?.players[0]).toEqual(game.players[0]);
    expect(result.game?.players[2]).toEqual(game.players[2]);
  });

  it('merges partial fields into the matching player at index 2, leaving others untouched', () => {
    const game = makeGame();

    const result = gameReducer({ game }, updatePlayer({ id: 'p3', username: 'Carolina' }));

    expect(result.game?.players[2]).toEqual({
      ...makePlayer({ _id: 'p3', index: 2, username: 'Carol', hp: 6 }),
      username: 'Carolina',
    });
    expect(result.game?.players[0]).toEqual(game.players[0]);
    expect(result.game?.players[1]).toEqual(game.players[1]);
  });

  it('merges partial fields into the matching player at index 0, leaving others untouched', () => {
    const game = makeGame();

    const result = gameReducer({ game }, updatePlayer({ id: 'p1', hp: 1 }));

    expect(result.game?.players[0]).toEqual({
      ...makePlayer({ _id: 'p1', index: 0, username: 'Alice', hp: 10 }),
      hp: 1,
    });
  });

  it('does not change anything when the id does not match any player', () => {
    const game = makeGame();

    const result = gameReducer({ game }, updatePlayer({ id: 'doesNotExist', hp: 999 }));

    expect(result.game?.players).toEqual(game.players);
  });

  it('does not throw when state.game is null', () => {
    expect(() => gameReducer(emptyState, updatePlayer({ id: 'p1', hp: 1 }))).not.toThrow();
    const result = gameReducer(emptyState, updatePlayer({ id: 'p1', hp: 1 }));
    expect(result.game).toBeNull();
  });
});

// ---- selectActivePlayer ---------------------------------------------------

describe('selectActivePlayer', () => {
  it('returns the player whose _id equals state.game.actif', () => {
    const game = makeGame({ actif: 'p2' });

    const result = selectActivePlayer({ game });

    expect(result).toEqual(game.players[1]);
  });

  it('returns null when game is null', () => {
    const result = selectActivePlayer(emptyState);

    expect(result).toBeNull();
  });

  it('returns null when actif does not match any player', () => {
    const game = makeGame({ actif: 'doesNotExist' });

    const result = selectActivePlayer({ game });

    expect(result).toBeNull();
  });

  it('returns null when actif is null', () => {
    const game = makeGame({ actif: null });

    const result = selectActivePlayer({ game });

    expect(result).toBeNull();
  });
});
