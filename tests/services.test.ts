import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createALobby,
  getALobby,
  changeOptions,
  removeAPlayer,
  addAPlayer,
  changeReadyStatus,
  startAGame,
  lockDices,
  endTurn,
  changeGameStep,
} from '@/services/services';
import { Options, step, User } from '@/types/gameType';

const BASE = 'http://localhost:3001';

const user: User = { id: 'user-1', username: 'Alice' };
const options: Options = { maxHp: 100, maxPlayers: 4, private: true };

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  // `ok`/`text` are included so the fire-and-forget functions' internal
  // success/failure check (added to surface silently-swallowed errors)
  // doesn't spuriously log a failure for this default successful mock.
  mockFetch.mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(''),
    json: () => Promise.resolve({ ok: true }),
  });
});

function getCallArgs() {
  expect(mockFetch).toHaveBeenCalledTimes(1);
  const [url, opts] = mockFetch.mock.calls[0];
  return { url, opts };
}

describe('createALobby', () => {
  it('POSTs to /api/createALobby with { user, private } and returns json()', async () => {
    const responseBody = { _id: 'lobby-1' };
    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(responseBody) });

    const result = await createALobby(user, true);

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/createALobby`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ user, private: true });
    expect(result).toEqual(responseBody);
  });
});

describe('getALobby', () => {
  it('GETs /api/lobby/:id with no body and returns json()', async () => {
    const responseBody = { _id: 'lobby-1', players: [] };
    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(responseBody) });

    const result = await getALobby('lobby-1');

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/lobby/lobby-1`);
    expect(opts.method).toBe('get');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(opts.body).toBeUndefined();
    expect(result).toEqual(responseBody);
  });
});

describe('changeOptions', () => {
  it('POSTs to /api/changeOptions with { user, id, options } and returns json()', async () => {
    const responseBody = { updated: true };
    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(responseBody) });

    const result = await changeOptions(user, 'lobby-1', options);

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/changeOptions`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ user, id: 'lobby-1', options });
    expect(result).toEqual(responseBody);
  });
});

describe('removeAPlayer', () => {
  it('POSTs to /api/removeAPlayer with { user, id, IndexToKick } and returns json()', async () => {
    const responseBody = { kicked: true };
    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(responseBody) });

    const result = await removeAPlayer(user, 'lobby-1', 2);

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/removeAPlayer`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ user, id: 'lobby-1', IndexToKick: 2 });
    expect(result).toEqual(responseBody);
  });
});

describe('addAPlayer', () => {
  it('POSTs to /api/addAPlayer with { id, user } and returns json()', async () => {
    const responseBody = { _id: 'lobby-1', players: [{ username: 'Alice' }] };
    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(responseBody) });

    const result = await addAPlayer(user, 'lobby-1');

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/addAPlayer`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ id: 'lobby-1', user });
    expect(result).toEqual(responseBody);
  });
});

describe('changeReadyStatus', () => {
  it('POSTs to /api/readyUp with { user, id } and returns json()', async () => {
    const responseBody = { ready: true };
    mockFetch.mockResolvedValueOnce({ json: () => Promise.resolve(responseBody) });

    const result = await changeReadyStatus(user, 'lobby-1');

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/readyUp`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ user, id: 'lobby-1' });
    expect(result).toEqual(responseBody);
  });
});

describe('startAGame', () => {
  it('fires-and-forgets a POST to /api/startGame with keepalive and returns void', () => {
    const result = startAGame(user, 'lobby-1');

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/startGame`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ user, id: 'lobby-1' });
    expect(opts.keepalive).toBe(true);
    expect(result).toBeUndefined();
  });
});

describe('lockDices', () => {
  it('fires-and-forgets a POST to /api/lockDices with keepalive and returns void', () => {
    const selectedDices = [1, 2, 5];
    const result = lockDices(user, 'lobby-1', selectedDices);

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/lockDices`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ user, id: 'lobby-1', lockedDices: selectedDices });
    expect(opts.keepalive).toBe(true);
    expect(result).toBeUndefined();
  });

  it('logs an error instead of failing silently when the server responds with a non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('boom') });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    lockDices(user, 'lobby-1', [0, 1]);
    // let the fetch promise chain (.then/.catch) flush before asserting
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('lockDices'), 'boom');
    errorSpy.mockRestore();
  });

  it('logs a network error instead of failing silently when fetch itself rejects', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network down'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    lockDices(user, 'lobby-1', [0, 1]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('lockDices'), expect.any(Error));
    errorSpy.mockRestore();
  });
});

describe('endTurn', () => {
  it('fires-and-forgets a POST to /api/endTurn with keepalive and returns void', () => {
    const result = endTurn(user, 'lobby-1');

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/endTurn`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ user, id: 'lobby-1' });
    expect(opts.keepalive).toBe(true);
    expect(result).toBeUndefined();
  });
});

describe('changeGameStep', () => {
  it('fires-and-forgets a POST to /api/changeGameStep with keepalive and returns void', () => {
    const result = changeGameStep('lobby-1', step.attack);

    const { url, opts } = getCallArgs();
    expect(url).toBe(`${BASE}/api/changeGameStep`);
    expect(opts.method).toBe('post');
    expect(opts.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(opts.body)).toEqual({ id: 'lobby-1', step: step.attack });
    expect(opts.keepalive).toBe(true);
    expect(result).toBeUndefined();
  });
});
