import Pusher from 'pusher-js';

let pusherInstance: Pusher;

export const getPusher = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher('46c45f5e0f237306de38', {
      cluster: 'eu',
    });
  }
  return pusherInstance;
};
