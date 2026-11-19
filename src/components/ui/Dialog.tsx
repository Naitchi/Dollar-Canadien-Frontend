import { ReactNode, useEffect, useId, useRef } from 'react';

import Icon from './Icon';
import styles from './Dialog.module.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // Buttons at the bottom.
  actions?: ReactNode;
  // Smaller dialog for confirmations.
  size?: 'sm' | 'md';
}

/**
 * Native modal dialog: focus moves in and is trapped by the browser, Escape
 * closes it, focus returns to what opened it. Always closable.
 */
const Dialog = ({ open, onClose, title, children, actions, size = 'md' }: DialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
      // An element marked data-autofocus gets the focus (e.g. "Rester").
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      document.documentElement.style.overflow = '';
      returnFocus.current?.focus?.();
      if (open) onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [open, onClose]);

  // Unmounted while open (e.g. the page changes): don't leave the page locked.
  useEffect(
    () => () => {
      document.documentElement.style.overflow = '';
    },
    [],
  );

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles[size]}`}
      aria-labelledby={titleId}
      // Click on the backdrop (outside the box) closes it.
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      {open && (
        <div className={styles.box}>
          <header className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} onClick={() => ref.current?.close()}>
              <Icon name="close" size={20} />
              <span className="sr-only">Fermer</span>
            </button>
          </header>
          <div className={styles.body}>{children}</div>
          {actions && <footer className={styles.actions}>{actions}</footer>}
        </div>
      )}
    </dialog>
  );
};

export default Dialog;
