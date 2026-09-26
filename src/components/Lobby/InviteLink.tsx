import { useEffect, useState } from 'react';

// Style
import styles from './Lobby.module.css';

// The lobby's link (this page), with a button to copy it.
const InviteLink = () => {
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInviteUrl(window.location.href);
  }, []);

  const copy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <label className={styles.hint} htmlFor="inviteLink">
        Invite tes potes avec ce lien :
      </label>
      <div className={styles.inviteRow}>
        <input
          id="inviteLink"
          className={styles.input}
          value={inviteUrl}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        <button onClick={copy} className={styles.secondaryButton}>
          {copied ? 'Lien copié !' : 'Copier'}
        </button>
      </div>
    </>
  );
};

export default InviteLink;
