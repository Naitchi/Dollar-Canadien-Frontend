import { useEffect, useRef, useState } from 'react';

import { useConnectionState } from '@/hooks/useConnectionState';

import { useAnnounce } from '../Announcer/Announcer';
import Icon from '../ui/Icon';
import styles from './ConnectionBanner.module.css';

// The realtime connection always starts "connecting": only complain after this long.
const GRACE_MS = 2000;
const RECOVERED_MS = 2500;

// Shown only when the realtime connection is degraded, with a way out
// (reload). A short "Reconnecté" confirmation follows a recovery.
const ConnectionBanner = () => {
  const state = useConnectionState();
  const announce = useAnnounce();
  const [degraded, setDegraded] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const wasDegraded = useRef(false);

  useEffect(() => {
    if (state === 'connected') {
      setDegraded(false);
      if (wasDegraded.current) {
        wasDegraded.current = false;
        setRecovered(true);
        announce('Reconnecté.');
        const timeout = setTimeout(() => setRecovered(false), RECOVERED_MS);
        return () => clearTimeout(timeout);
      }
      return;
    }
    const timeout = setTimeout(() => {
      setDegraded(true);
      if (!wasDegraded.current) announce('Connexion perdue. Reconnexion en cours…', 'assertive');
      wasDegraded.current = true;
    }, GRACE_MS);
    return () => clearTimeout(timeout);
  }, [state, announce]);

  if (degraded) {
    const failed = state === 'failed' || state === 'unavailable';
    return (
      <div className={`${styles.banner} ${styles.down}`}>
        <Icon name="wifiOff" />
        <p className={styles.text}>
          {failed ? 'Connexion perdue.' : 'Reconnexion…'}{' '}
          <span className={styles.sub}>Les coups des autres arriveront dès que ça revient.</span>
        </p>
        <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
          <Icon name="refresh" size={18} />
          Recharger
        </button>
      </div>
    );
  }

  if (recovered) {
    return (
      <div className={`${styles.banner} ${styles.up}`}>
        <Icon name="check" />
        <p className={styles.text}>Reconnecté</p>
      </div>
    );
  }

  return null;
};

export default ConnectionBanner;
