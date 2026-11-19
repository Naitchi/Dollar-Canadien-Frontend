import { useEffect, useId, useRef, useState } from 'react';

import { PREFS_CHANGE_EVENT, canVibrate, setVibrationsEnabled, vibrationsEnabled } from '@/functions/prefs';

import Icon from '../ui/Icon';
import styles from './GameMenu.module.css';

interface GameMenuProps {
  onHowToPlay: () => void;
  onLeave: () => void;
  leaveLabel?: string;
}

// The header's "⋯" menu, the same on every game screen: rules, vibrations,
// back home. A disclosure (button + list of buttons): Escape and clicks
// outside close it.
const GameMenu = ({ onHowToPlay, onLeave, leaveLabel = "Retour à l'accueil" }: GameMenuProps) => {
  const [open, setOpen] = useState(false);
  const [vibrationSupported, setVibrationSupported] = useState(false);
  const [vibrations, setVibrations] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    setVibrationSupported(canVibrate());
    const sync = () => setVibrations(vibrationsEnabled());
    sync();
    window.addEventListener(PREFS_CHANGE_EVENT, sync);
    return () => window.removeEventListener(PREFS_CHANGE_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="menu" size={24} />
        <span className="sr-only">Menu</span>
      </button>
      <div id={menuId} className={styles.menu} hidden={!open}>
        <ul role="list" className={styles.list}>
          <li>
            <button type="button" className={styles.item} onClick={run(onHowToPlay)}>
              <Icon name="help" />
              Comment jouer
            </button>
          </li>
          {vibrationSupported && (
            <li>
              <button
                type="button"
                className={styles.item}
                role="switch"
                aria-checked={vibrations}
                onClick={() => setVibrationsEnabled(!vibrations)}
              >
                <Icon name="vibrate" />
                Vibrations
                <span className={`${styles.switch} ${vibrations ? styles.on : ''}`} aria-hidden="true">
                  {vibrations ? 'Oui' : 'Non'}
                </span>
              </button>
            </li>
          )}
          <li>
            <button type="button" className={styles.item} onClick={run(onLeave)}>
              <Icon name="home" />
              {leaveLabel}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GameMenu;
