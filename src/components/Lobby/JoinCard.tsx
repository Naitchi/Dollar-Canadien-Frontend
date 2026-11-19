import { FormEvent, useId, useState } from 'react';

import { avatarFor } from '@/functions/game';

import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import surface from '../ui/Surface.module.css';
import styles from './Lobby.module.css';

// Same limit as MAX_USERNAME_LENGTH in the backend, which cuts longer names.
const MAX_USERNAME_LENGTH = 24;

interface JoinCardProps {
  hostName?: string;
  playerCount: number;
  onSubmit: (username: string) => void;
}

// What someone opening an invite link sees first (instead of a modal that
// couldn't be closed): who invites them, and their name.
const JoinCard = ({ hostName, playerCount, onSubmit }: JoinCardProps) => {
  const inputId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const typed = name.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!typed) {
      setError('Écris un nom pour rejoindre la table.');
      return;
    }
    onSubmit(typed);
  };

  return (
    <div className={styles.centered}>
      <form className={`${surface.board} ${styles.joinCard}`} onSubmit={submit} noValidate>
        <p className={styles.invite}>
          <Icon name="users" size={20} />
          {hostName ? (
            <>
              <strong>{hostName}</strong> t&apos;invite à sa table
            </>
          ) : (
            'On t’invite à une table'
          )}
          {playerCount > 0 && (
            <span className={styles.inviteCount}>
              · {playerCount} joueur{playerCount > 1 ? 's' : ''}
            </span>
          )}
        </p>
        <h1 className={styles.joinTitle}>C&apos;est quoi ton nom ?</h1>
        <div className={styles.nameRow}>
          <Avatar avatar={avatarFor(typed || '?')} size="md" />
          <input
            id={inputId}
            className={surface.input}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            maxLength={MAX_USERNAME_LENGTH}
            autoComplete="nickname"
            placeholder="Ton pseudo"
            aria-label="Ton nom"
            aria-invalid={!!error}
            aria-describedby={`${inputId}-hint`}
            autoFocus
          />
        </div>
        <p id={`${inputId}-hint`} className={error ? surface.error : surface.hint} role={error ? 'alert' : undefined}>
          {error ?? `Les autres le verront à la table · ${typed.length}/${MAX_USERNAME_LENGTH}`}
        </p>
        <Button type="submit" variant="primary" size="xl" block iconPill="arrowRight">
          Rejoindre la table
        </Button>
      </form>
    </div>
  );
};

export default JoinCard;
