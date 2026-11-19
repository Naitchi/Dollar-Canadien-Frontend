import { useEffect, useState } from 'react';

import { getPusher } from '@/functions/pusher';

export type ConnectionState =
  | 'initialized'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'failed'
  | 'disconnected';

/**
 * The real state of our realtime connection (Pusher). Only read here: the
 * game page keeps owning the channel subscription.
 */
export const useConnectionState = (): ConnectionState => {
  const [state, setState] = useState<ConnectionState>('initialized');

  useEffect(() => {
    const connection = getPusher().connection;
    setState(connection.state as ConnectionState);
    const handleChange = ({ current }: { current: ConnectionState }) => setState(current);
    connection.bind('state_change', handleChange);
    return () => {
      connection.unbind('state_change', handleChange);
    };
  }, []);

  return state;
};
