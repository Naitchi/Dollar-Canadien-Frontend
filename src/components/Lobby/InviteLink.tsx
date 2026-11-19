import { useEffect, useId, useRef, useState } from 'react';

import { useAnnounce } from '../Announcer/Announcer';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import surface from '../ui/Surface.module.css';
import styles from './Lobby.module.css';

type CopyState = 'idle' | 'copied' | 'manual';

// The lobby's link (this page): share it natively when the phone can, copy
// it otherwise (with a manual fallback where the clipboard is unavailable,
// e.g. plain http on a local network).
const InviteLink = () => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const announce = useAnnounce();
  const [inviteUrl, setInviteUrl] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setInviteUrl(window.location.href);
    setCanShare(typeof navigator.share === 'function');
    return () => clearTimeout(resetTimeout.current);
  }, []);

  const copy = async () => {
    clearTimeout(resetTimeout.current);
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyState('copied');
      announce('Lien copié. Envoie-le à tes amis.');
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      setCopyState('manual');
      announce('Copie automatique impossible : le lien est sélectionné, copie-le.');
    }
    resetTimeout.current = setTimeout(() => setCopyState('idle'), 2500);
  };

  const share = async () => {
    try {
      await navigator.share({
        title: 'Dollar Canadien',
        text: 'Viens jouer aux dés avec nous !',
        url: inviteUrl,
      });
    } catch {
      // Cancelled by the user: nothing to do.
    }
  };

  return (
    <section className={`${surface.paper} ${styles.section}`} aria-labelledby={`${inputId}-title`}>
      <h2 id={`${inputId}-title`} className={surface.sectionTitle}>
        <span className={surface.dot} style={{ background: 'var(--c-blue)' }} aria-hidden="true" />
        Invite tes potes
      </h2>
      <p className={styles.sectionText}>Envoie ce lien : ils arrivent direct à ta table.</p>
      <label htmlFor={inputId} className="sr-only">
        Lien d&apos;invitation
      </label>
      <div className={styles.inviteRow}>
        <input
          ref={inputRef}
          id={inputId}
          className={`${surface.input} ${styles.inviteInput}`}
          value={inviteUrl}
          readOnly
          onFocus={(event) => event.target.select()}
        />
        <div className={styles.inviteButtons}>
          {canShare && (
            <Button variant="primary" icon="share" onClick={share}>
              Partager
            </Button>
          )}
          <Button variant={canShare ? 'neutral' : 'primary'} icon={copyState === 'copied' ? 'check' : 'copy'} onClick={copy}>
            {copyState === 'copied' ? 'Copié !' : 'Copier'}
          </Button>
        </div>
      </div>
      {copyState === 'manual' && (
        <p className={surface.hint}>
          <Icon name="alert" size={16} /> Le lien est sélectionné : copie-le avec ton téléphone ou Ctrl+C.
        </p>
      )}
    </section>
  );
};

export default InviteLink;
