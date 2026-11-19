import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useEffect, useId, useState } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';

import HowToPlay from '@/components/HowToPlay/HowToPlay';
import AppHeader from '@/components/layout/AppHeader';
import Avatar from '@/components/ui/Avatar';
import { Coin } from '@/components/ui/Brand';
import Button, { buttonClass } from '@/components/ui/Button';
import DieFace from '@/components/ui/DieFace';
import Icon from '@/components/ui/Icon';
import surface from '@/components/ui/Surface.module.css';

import { getStoredUser } from '@/functions/functions';
import { avatarFor, extractLobbyId, looksLikeLobbyId } from '@/functions/game';
import { getLastGameId, setLastGameId } from '@/functions/prefs';
import { createALobby, getALobby } from '@/services/services';
import { setMe, setUser } from '@/store/slices/clientSlice';
import { setGame } from '@/store/slices/gameSlice';
import { User } from '@/types/gameType';

import styles from '../styles/index.module.css';

// Same limit as MAX_USERNAME_LENGTH in the backend, which cuts longer names.
const MAX_USERNAME_LENGTH = 24;

interface Resume {
  id: string;
  started: boolean;
}

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch();
  const nameId = useId();
  const joinId = useId();

  // undefined: not read from localStorage yet (avoids flashing the name step).
  const [user, setLocalUser] = useState<User | null | undefined>(undefined);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setLocalUser(stored);
    if (stored) {
      setNameDraft(stored.username);
      dispatch(setUser(stored));
    }
  }, [dispatch]);

  // "Retourne à ta partie": only if that game still exists, we're in it and it isn't over.
  useEffect(() => {
    const lastId = getLastGameId();
    const stored = getStoredUser();
    if (!lastId || !stored) return;
    let cancelled = false;
    getALobby(lastId, stored)
      .then(({ game, me }) => {
        if (cancelled) return;
        if (me && game.step !== 'gameEnd') setResume({ id: game._id, started: !!game.actif });
        else setLastGameId(null);
      })
      .catch(() => {
        if (!cancelled) setLastGameId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const askingName = user === null || editingName;
  const typedName = nameDraft.trim();
  const preview = avatarFor(typedName || '?');

  /** The user to play as: the stored one, or a new one from the typed name. */
  const commitUser = (): User | null => {
    if (!typedName) return null;
    const next: User =
      user && user.username === typedName ? user : { id: user?.id || uuidv4(), username: typedName };
    try {
      localStorage.setItem('user', JSON.stringify(next));
    } catch {
      // Private mode: still playable for this visit.
    }
    setLocalUser(next);
    setEditingName(false);
    dispatch(setUser(next));
    return next;
  };

  const createLobby = async () => {
    if (creating) return;
    const player = commitUser();
    if (!player) {
      setCreateError("Choisis d'abord un nom.");
      document.getElementById(nameId)?.focus();
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const { game, me } = await createALobby(player);
      dispatch(setMe(me));
      dispatch(setGame(game));
      await router.push(`/game?id=${game._id}`);
    } catch (error) {
      console.error('Erreur lors de la création du lobby :', error);
      setCreateError((error as Error).message || 'Impossible de créer la partie. Réessaie.');
      setCreating(false);
    }
  };

  const joinLobby = (event: FormEvent) => {
    event.preventDefault();
    const lobbyId = extractLobbyId(joinInput);
    if (!lobbyId) {
      setJoinError('Colle le lien que ton ami t’a envoyé, ou le code de la partie.');
      return;
    }
    if (!looksLikeLobbyId(lobbyId)) {
      setJoinError('Ce lien ou ce code ne ressemble pas à une partie. Vérifie-le.');
      return;
    }
    const player = commitUser();
    if (!player) {
      setJoinError("Choisis d'abord un nom.");
      document.getElementById(nameId)?.focus();
      return;
    }
    router.push(`/game?id=${lobbyId}`);
  };

  return (
    <>
      <Head>
        <title>Dollar Canadien · Le jeu de dés entre amis</title>
      </Head>
      <AppHeader />
      <main id="contenu" className={styles.page}>
        <section className={styles.hero} aria-labelledby="titre">
          <div className={styles.pitch}>
            <div className={styles.coinWrap} aria-hidden="true">
              <Coin size={88} />
            </div>
            <h1 id="titre" className={styles.title}>
              Dollar <span>Canadien</span>
            </h1>
            <p className={styles.tagline}>
              Le jeu de dés entre amis. <strong>Fais 30… ou fais mal.</strong> Le dernier debout gagne.
            </p>
            <div className={styles.heroDice} aria-hidden="true">
              <DieFace value={6} size={52} />
              <DieFace value={1} size={52} />
              <DieFace value={4} size={52} />
            </div>
          </div>

          <div className={`${surface.board} ${styles.start}`}>
            {user === undefined ? (
              <div className={styles.startSkeleton} aria-hidden="true" />
            ) : askingName ? (
              <div className={surface.field}>
                <label htmlFor={nameId} className={styles.startLabel}>
                  C&apos;est quoi ton nom ?
                </label>
                <div className={styles.nameRow}>
                  <Avatar avatar={preview} size="md" />
                  <input
                    id={nameId}
                    className={surface.input}
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && typedName) commitUser();
                    }}
                    maxLength={MAX_USERNAME_LENGTH}
                    autoComplete="nickname"
                    placeholder="Ton pseudo"
                    aria-describedby={`${nameId}-hint`}
                    autoFocus={editingName}
                  />
                </div>
                <p id={`${nameId}-hint`} className={surface.hint}>
                  Tes amis le verront à la table · {typedName.length}/{MAX_USERNAME_LENGTH}
                </p>
                {editingName && user && (
                  <div className={styles.nameActions}>
                    <Button size="sm" variant="primary" onClick={commitUser} unavailable={!typedName}>
                      Enregistrer
                    </Button>
                    <Button
                      size="sm"
                      variant="quiet"
                      onClick={() => {
                        setEditingName(false);
                        setNameDraft(user.username);
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              user && (
                <div className={styles.identity}>
                  <Avatar avatar={avatarFor(user.username)} size="md" />
                  <p className={styles.identityText}>
                    <span className={surface.labelOnPaper}>Tu joues en tant que</span>
                    <span className={styles.identityName}>{user.username}</span>
                  </p>
                  <Button size="sm" variant="quiet" onClick={() => setEditingName(true)}>
                    Modifier
                  </Button>
                </div>
              )
            )}

            <div className={styles.actions}>
              <Button
                variant="primary"
                size="xl"
                block
                iconPill="arrowRight"
                pending={creating}
                onClick={createLobby}
              >
                {creating ? 'Création…' : 'Créer une partie'}
              </Button>
              {createError && (
                <p className={surface.error} role="alert">
                  <Icon name="alert" size={18} /> {createError}
                </p>
              )}

              {!joinOpen ? (
                <Button variant="neutral" size="lg" block icon="link" onClick={() => setJoinOpen(true)} aria-expanded={false}>
                  Rejoindre avec un lien
                </Button>
              ) : (
                <form className={styles.joinForm} onSubmit={joinLobby} noValidate>
                  <label htmlFor={joinId} className={surface.fieldLabel}>
                    Lien ou code de la partie
                  </label>
                  <div className={styles.joinRow}>
                    <input
                      id={joinId}
                      className={surface.input}
                      value={joinInput}
                      onChange={(event) => {
                        setJoinInput(event.target.value);
                        setJoinError(null);
                      }}
                      placeholder="Colle le lien d'invitation"
                      autoFocus
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={!!joinError}
                      aria-describedby={joinError ? `${joinId}-error` : undefined}
                    />
                    <Button type="submit" variant="success" icon="arrowRight">
                      Rejoindre
                    </Button>
                  </div>
                  {joinError && (
                    <p id={`${joinId}-error`} className={surface.error} role="alert">
                      <Icon name="alert" size={18} /> {joinError}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </section>

        {resume && (
          <section className={`${surface.paper} ${styles.resume}`} aria-label="Ta partie en cours">
            <span className={styles.resumeIcon} aria-hidden="true">
              <Icon name="dice" size={26} />
            </span>
            <p className={styles.resumeText}>
              <strong>{resume.started ? 'Ta partie est en cours.' : 'Ton salon t’attend.'}</strong>{' '}
              {resume.started ? 'Tes amis jouent sans toi !' : 'Tes amis sont peut-être encore là.'}
            </p>
            <Link href={`/game?id=${resume.id}`} className={buttonClass({ variant: 'yellow' })}>
              Retourne à ta partie
            </Link>
          </section>
        )}

        <section className={styles.rules} aria-labelledby="regles">
          <h2 id="regles" className={styles.sectionTitle}>
            <Icon name="help" size={22} /> Comment jouer
          </h2>
          <HowToPlay variant="cards" />
        </section>
      </main>
    </>
  );
}
