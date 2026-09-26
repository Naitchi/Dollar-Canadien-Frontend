import Pusher from 'pusher-js';

let pusherInstance: Pusher;

export const getPusher = () => {
  if (!pusherInstance) {
    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY ?? '46c45f5e0f237306de38', {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? 'eu',
    });
  }
  return pusherInstance;
};
