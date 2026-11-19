import { ButtonHTMLAttributes, MouseEvent, forwardRef } from 'react';

import Icon, { IconName } from './Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'yellow' | 'neutral' | 'quiet' | 'dark' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  iconOnly?: boolean;
  className?: string;
}

/** Button classes, also for links styled as buttons (next/link). */
export const buttonClass = ({ variant = 'neutral', size = 'md', block, iconOnly, className }: ClassOptions = {}) =>
  [
    styles.btn,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    block ? styles.block : '',
    iconOnly ? styles.iconOnly : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  // Icon after the label, in a light pill (the reference's CTA).
  iconPill?: IconName;
  block?: boolean;
  // Waiting for the server: spinner, label kept, clicks ignored, focus kept.
  pending?: boolean;
  // Looks unavailable but stays focusable and clickable (to explain why).
  unavailable?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'neutral',
    size = 'md',
    icon,
    iconPill,
    block,
    pending = false,
    unavailable = false,
    className,
    children,
    onClick,
    type = 'button',
    ...props
  },
  ref,
) {
  const iconOnly = !children && !!icon;
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // aria-disabled doesn't stop clicks by itself: a pending action must
    // never be sent twice.
    if (pending) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, block, iconOnly, className: `${pending ? styles.pending : ''} ${className ?? ''}` })}
      aria-disabled={pending || unavailable || undefined}
      aria-busy={pending || undefined}
      onClick={handleClick}
      {...props}
    >
      {pending ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} className={styles.icon} />
      )}
      {children && <span className={styles.label}>{children}</span>}
      {iconPill && !pending && (
        <span className={styles.iconPill} aria-hidden="true">
          <Icon name={iconPill} size={20} />
        </span>
      )}
    </button>
  );
});

export default Button;
