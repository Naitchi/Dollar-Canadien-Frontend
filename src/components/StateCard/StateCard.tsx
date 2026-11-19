import { ReactNode } from 'react';

import { Coin } from '../ui/Brand';
import styles from './StateCard.module.css';

interface StateCardProps {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  // 'error' tilts the coin like a sad mascot.
  tone?: 'info' | 'error';
  headingLevel?: 'h1' | 'h2';
}

// A full-width card for the states between screens: not found, kicked,
// join refused, etc. Always says what happened and offers a way out.
const StateCard = ({ title, children, actions, tone = 'info', headingLevel = 'h1' }: StateCardProps) => {
  const Heading = headingLevel;
  return (
    <div className={styles.wrap}>
      <section className={`${styles.card} ${tone === 'error' ? styles.error : ''}`}>
        <span className={styles.mascot} aria-hidden="true">
          <Coin size={64} />
        </span>
        <Heading className={styles.title}>{title}</Heading>
        {children && <div className={styles.body}>{children}</div>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </section>
    </div>
  );
};

export default StateCard;
