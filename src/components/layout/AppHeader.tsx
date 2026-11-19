import Link from 'next/link';
import { MouseEvent, ReactNode } from 'react';

import { Coin } from '../ui/Brand';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  // Something in the middle (e.g. the stake of the game).
  center?: ReactNode;
  // Buttons on the right (chat, menu…).
  actions?: ReactNode;
  // Called instead of navigating when leaving needs a confirmation (or a
  // call to the server, like leaving the lobby).
  onLeave?: () => void;
}

// The dark chrome bar of every page: logo (back to the home page), context,
// actions. Skip link first, for keyboard users.
const AppHeader = ({ center, actions, onLeave }: AppHeaderProps) => {
  const handleLogo = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onLeave) return;
    event.preventDefault();
    onLeave();
  };

  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} onClick={handleLogo}>
            <span className={styles.coin}>
              <Coin size={30} />
            </span>
            <span className={styles.wordmark}>Dollar Canadien</span>
            <span className="sr-only"> — accueil</span>
          </Link>
          {center && <div className={styles.center}>{center}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      </header>
    </>
  );
};

export default AppHeader;
