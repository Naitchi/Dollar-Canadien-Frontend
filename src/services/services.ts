import { Game, Options, step, User } from '@/types/gameType';

const link = 'http://localhost:3001';

// These action calls are fire-and-forget (the real game state update comes
// back later via Pusher, not via this response), so a failure here would
// otherwise be swallowed silently and leave the UI stuck forever waiting for
// an update that's never coming. Logging it at least makes that visible.
const logIfFailed = (endpoint: string) => (response: Response) => {
  if (!response.ok) {
    response
      .text()
      .then((text) => console.error(`[${endpoint}] a échoué (${response.status}) :`, text))
      .catch(() => console.error(`[${endpoint}] a échoué avec le statut ${response.status}`));
  }
};

const logNetworkError = (endpoint: string) => (error: unknown) => {
  console.error(`[${endpoint}] erreur réseau :`, error);
};

export const createALobby = async (user: User, privacy: boolean) => {
  console.log('in createALobby');

  const response = await fetch(`${link}/api/createALobby`, {
    method: 'post',
    body: JSON.stringify({
      user: user,
      private: privacy,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};

export const getALobby = async (id: string): Promise<Game> => {
  console.log('in getALobby');
  const response = await fetch(`${link}/api/lobby/${id}`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};

export const changeOptions = async (user: User, id: string, options: Options) => {
  console.log('in changeOptions');

  const response = await fetch(`${link}/api/changeOptions`, {
    method: 'post',
    body: JSON.stringify({
      user: user,
      id: id,
      options: options,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.json();
};

export const removeAPlayer = async (user: User, id: string, IndexToKick: number) => {
  console.log('in removeAPlayer');

  const response = await fetch(`${link}/api/removeAPlayer`, {
    method: 'post',
    body: JSON.stringify({
      user: user,
      id: id,
      IndexToKick: IndexToKick,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    keepalive: true, // important - lets the request survive a page unload (e.g. closing the lobby tab)
  });

  return response.json();
};

export const addAPlayer = async (user: User, id: string): Promise<Game> => {
  console.log('in addAPlayer');

  const response = await fetch(`${link}/api/addAPlayer`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, user }),
  });

  return response.json();
};

export const changeReadyStatus = async (user: User, id: string): Promise<Game> => {
  console.log('in readyUp');
  const newGame = await fetch(`${link}/api/readyUp`, {
    method: 'post',
    body: JSON.stringify({ user, id }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return newGame.json();
};

// TODO faire un service d'admin, genre pour gérer la privacy de la room, kick des gens, gérer les hps max ce genre de trucs

export const startAGame = (user: User, id: string): void => {
  console.log('in startAGame');
  console.log(user, id);

  fetch(`${link}/api/startGame`, {
    method: 'post',
    body: JSON.stringify({ user, id }),
    headers: {
      'Content-Type': 'application/json',
    },
    keepalive: true, // important
  })
    .then(logIfFailed('startAGame'))
    .catch(logNetworkError('startAGame'));
};

export const lockDices = (user: User, id: string, selectedDices: number[]): void => {
  console.log('in lockDices');

  fetch(`${link}/api/lockDices`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, id, lockedDices: selectedDices }),
    keepalive: true, // important
  })
    .then(logIfFailed('lockDices'))
    .catch(logNetworkError('lockDices'));
};

export const endTurn = (user: User, id: string): void => {
  console.log('in endTurn');

  fetch(`${link}/api/endTurn`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user, id }),
    keepalive: true, // important
  })
    .then(logIfFailed('endTurn'))
    .catch(logNetworkError('endTurn'));
};

export const changeGameStep = (id: string, step: step): void => {
  console.log('in changeGameStep');

  fetch(`${link}/api/changeGameStep`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, step: step }),
    keepalive: true, // important
  })
    .then(logIfFailed('changeGameStep'))
    .catch(logNetworkError('changeGameStep'));
};
