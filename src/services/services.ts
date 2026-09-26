import { ChatMessage, Game, LobbyResponse, Options, step, User } from '@/types/gameType';

const link = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Throws with the server's own message (e.g. "Le salon est plein.") on an
// error status, instead of letting response.json() choke on a text body.
const parseResponse = async <T>(endpoint: string, response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `[${endpoint}] a échoué (${response.status})`);
  }
  return response.json();
};

// Calls whose answer we need: resolves with the JSON the server sent back,
// or throws with its error message.
const request = async <T>(endpoint: string, init: RequestInit): Promise<T> => {
  console.log(`in ${endpoint}`);
  const response = await fetch(`${link}/api/${endpoint}`, init);
  return parseResponse<T>(endpoint, response);
};

const post = <T>(endpoint: string, body: unknown, keepalive = false): Promise<T> =>
  request<T>(endpoint, {
    method: 'post',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
    ...(keepalive ? { keepalive } : {}),
  });

// These action calls are fire-and-forget (the real game state update comes
// back later via Pusher, not via this response), so a failure here would
// otherwise be swallowed silently and leave the UI stuck forever waiting for
// an update that's never coming. Logging it at least makes that visible.
const logIfFailed =
  (endpoint: string, expectedStatuses: number[] = []) =>
  (response: Response) => {
    if (!response.ok && !expectedStatuses.includes(response.status)) {
      response
        .text()
        .then((text) => console.error(`[${endpoint}] a échoué (${response.status}) :`, text))
        .catch(() => console.error(`[${endpoint}] a échoué avec le statut ${response.status}`));
    }
  };

const logNetworkError = (endpoint: string) => (error: unknown) => {
  console.error(`[${endpoint}] erreur réseau :`, error);
};

interface SendOptions {
  // Lets the request survive a page unload (e.g. closing the tab mid-action).
  keepalive?: boolean;
  // Error statuses that are part of the normal flow, not worth logging.
  expectedStatuses?: number[];
}

const send = (
  endpoint: string,
  body: unknown,
  { keepalive = true, expectedStatuses = [] }: SendOptions = {},
): void => {
  console.log(`in ${endpoint}`);
  fetch(`${link}/api/${endpoint}`, {
    method: 'post',
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
    keepalive,
  })
    .then(logIfFailed(endpoint, expectedStatuses))
    .catch(logNetworkError(endpoint));
};

// ---- Lobby ----

export const createALobby = (user: User): Promise<LobbyResponse> =>
  post<LobbyResponse>('createALobby', { user });

// `user` is optional: when given, its secret lets the server tell us which
// player we are in this game (`me`), without it ever being broadcast.
// `serverTime` is the server's clock when it answered (ms since epoch).
export const getALobby = (
  id: string,
  user: User | null,
): Promise<LobbyResponse & { serverTime: number }> =>
  request(`lobby/${id}`, {
    method: 'get',
    headers: { ...JSON_HEADERS, ...(user ? { 'X-Player-Secret': user.id } : {}) },
  });

export const addAPlayer = (user: User, id: string): Promise<LobbyResponse> =>
  post<LobbyResponse>('addAPlayer', { id, user });

// `targetId` is the PUBLIC id of the player to remove (ourselves to leave).
// keepalive: also sent when the lobby tab is being closed.
export const removeAPlayer = (user: User, id: string, targetId: string): Promise<Game> =>
  post<Game>('removeAPlayer', { user, id, targetId }, true);

export const changeOptions = (user: User, id: string, options: Options): Promise<Game> =>
  post<Game>('changeOptions', { user, id, options });

export const changeReadyStatus = (user: User, id: string): Promise<Game> =>
  post<Game>('readyUp', { user, id });

// TODO faire un service d'admin, genre pour gérer la privacy de la room, kick des gens, gérer les hps max ce genre de trucs

export const startAGame = (user: User, id: string): void => send('startGame', { user, id });

// Host only, once the game is over: back to the lobby with the same players
// and rules.
export const restartGame = (user: User, id: string): void =>
  send('restartGame', { user, id }, { keepalive: false });

// ---- Chat ----

// Resolves with the message as broadcast to the lobby (to show it right away).
export const sendMessage = (user: User, id: string, text: string): Promise<ChatMessage> =>
  post<ChatMessage>('sendMessage', { user, id, text });

// ---- Turn ----

export const changeGameStep = (user: User, id: string, step: step): void =>
  send('changeGameStep', { user, id, step });

export const lockDices = (user: User, id: string, selectedDices: number[]): void =>
  send('lockDices', { user, id, lockedDices: selectedDices });

export const endTurn = (user: User, id: string): void => send('endTurn', { user, id });

// Called by every player's client once the turn deadline has passed, to
// unblock an AFK active player. A 409 just means the server doesn't agree
// it's time yet (clocks differ) or someone else already unblocked the turn,
// so it's not worth logging.
export const turnTimeout = (user: User, id: string): void =>
  send('turnTimeout', { user, id }, { keepalive: false, expectedStatuses: [409] });
