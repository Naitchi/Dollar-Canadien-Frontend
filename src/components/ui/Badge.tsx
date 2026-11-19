import { ReactNode } from 'react';

import Icon, { IconName } from './Icon';
import styles from './Badge.module.css';

export type BadgeTone = 'green' | 'blue' | 'yellow' | 'coral' | 'ink' | 'muted' | 'chip';

interface BadgeProps {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
  className?: string;
}

// Small status pill (TOI, JOUE, DANGER, K.O., Hôte, Prêt…). Always text:
// colour is never the only signal.
const Badge = ({ tone = 'muted', icon, children, className }: BadgeProps) => (
  <span className={`${styles.badge} ${styles[tone]} ${className ?? ''}`}>
    {icon && <Icon name={icon} size={13} />}
    {children}
  </span>
);

export default Badge;
