export const rollDices = (username: string, idRoom: string): void => {
  fetch(`${link}/api/getDicesResults`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username,
      idRoom: idRoom,
    }),
    keepalive: true, // important
  });
};
