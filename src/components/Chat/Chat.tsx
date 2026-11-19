import { FormEvent, forwardRef, useEffect, useMemo, useRef } from 'react';

import { Avatar as AvatarData } from '@/functions/game';
import { Player } from '@/types/gameType';

import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { ChatState } from './useChat';
import styles from './Chat.module.css';

// Same limit as MAX_MESSAGE_LENGTH in the backend (functions/chat.js).
const MAX_MESSAGE_LENGTH = 200;

const QUICK_REPLIES: { text: string; label: string }[] = [
  { text: '🔥', label: 'Envoyer : feu' },
  { text: '😂', label: 'Envoyer : mort de rire' },
  { text: 'Envoye, lance !', label: 'Envoyer : Envoye, lance !' },
  { text: 'GG', label: 'Envoyer : GG' },
];

const formatTime = (sentAt: string) =>
  new Date(sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

interface ChatToggleProps {
  chat: ChatState;
  panelId: string;
}

// The chat button, in the header. The unread count is part of its name.
export const ChatToggle = forwardRef<HTMLButtonElement, ChatToggleProps>(function ChatToggle(
  { chat, panelId },
  ref,
) {
  const label = chat.open
    ? 'Fermer le chat'
    : chat.unread > 0
      ? `Ouvrir le chat, ${chat.unread} nouveau${chat.unread > 1 ? 'x' : ''} message${chat.unread > 1 ? 's' : ''}`
      : 'Ouvrir le chat';
  return (
    <button
      ref={ref}
      type="button"
      className={styles.toggle}
      aria-expanded={chat.open}
      aria-controls={panelId}
      onClick={() => chat.setOpen(!chat.open)}
    >
      <Icon name="chat" size={22} />
      <span className={styles.toggleText} aria-hidden="true">
        Chat
      </span>
      <span className="sr-only">{label}</span>
      {chat.unread > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {chat.unread > 9 ? '9+' : chat.unread}
        </span>
      )}
    </button>
  );
});

interface ChatPanelProps {
  chat: ChatState;
  panelId: string;
  me: string | null;
  players: Player[];
  avatars: Record<string, AvatarData>;
  // Only the players of the lobby can write.
  isPlayer: boolean;
  onClose: () => void;
}

// Non-modal panel (the game stays usable and its announcements stay audible):
// a floating card on desktop, a bottom sheet on phones.
export const ChatPanel = ({ chat, panelId, me, players, avatars, isPlayer, onClose }: ChatPanelProps) => {
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const names = useMemo(() => new Map(players.map((player) => [player._id, player.username])), [players]);

  // Always show the latest message.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat.messages, chat.open]);

  useEffect(() => {
    if (chat.open) inputRef.current?.focus();
  }, [chat.open]);

  // While the sheet covers the bottom of the page on phones, let the page
  // scroll its content (and focused elements) above it.
  useEffect(() => {
    if (!chat.open) return;
    const root = document.documentElement;
    root.classList.add('chat-open');
    return () => root.classList.remove('chat-open');
  }, [chat.open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await chat.send(chat.draft);
    inputRef.current?.focus();
  };

  if (!chat.open) return null;

  return (
    <section
      id={panelId}
      className={styles.panel}
      aria-label="Chat de la partie"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <header className={styles.header}>
        <h2 className={styles.title}>
          <Icon name="chat" size={20} /> Chat
        </h2>
        <button type="button" className={styles.close} onClick={onClose}>
          <Icon name="close" size={20} />
          <span className="sr-only">Fermer le chat</span>
        </button>
      </header>

      <ol className={styles.messages} ref={listRef} aria-live="polite" aria-relevant="additions">
        {chat.messages.length === 0 && (
          <li className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true">
              💬
            </span>
            Rien pour l&apos;instant. Lance la conversation !
            <span className={styles.emptyHint}>
              Les messages ne sont pas gardés : tu ne vois que ceux envoyés depuis ton arrivée.
            </span>
          </li>
        )}
        {chat.messages.map((message) => {
          const mine = message.playerId === me;
          const name = names.get(message.playerId) ?? message.username;
          const avatar = avatars[name];
          return (
            <li key={message.id} className={`${styles.message} ${mine ? styles.mine : ''}`}>
              {!mine && avatar && <Avatar avatar={avatar} size="xs" className={styles.avatar} />}
              <div className={styles.bubble}>
                {!mine && <span className={styles.author}>{message.username}</span>}
                <span className={styles.text}>{message.text}</span>
                <time className={styles.time} dateTime={message.sentAt}>
                  {mine && <span className="sr-only">Toi, </span>}
                  {formatTime(message.sentAt)}
                </time>
              </div>
            </li>
          );
        })}
      </ol>

      {isPlayer ? (
        <>
          <div className={styles.quick} role="group" aria-label="Réponses rapides">
            {QUICK_REPLIES.map((reply) => (
              <button
                key={reply.text}
                type="button"
                className={styles.quickReply}
                onClick={() => chat.quickReply(reply.text)}
                aria-disabled={chat.sending || undefined}
                aria-label={reply.label}
              >
                {reply.text}
              </button>
            ))}
          </div>
          <form className={styles.form} onSubmit={submit}>
            <input
              ref={inputRef}
              className={styles.input}
              value={chat.draft}
              onChange={(event) => chat.setDraft(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Écris un message…"
              aria-label="Message"
              autoComplete="off"
            />
            <button className={styles.send} type="submit" aria-disabled={!chat.draft.trim() || chat.sending || undefined}>
              <Icon name="send" size={20} />
              <span className="sr-only">Envoyer</span>
            </button>
          </form>
        </>
      ) : (
        <p className={styles.hint}>Seuls les joueurs de la partie peuvent écrire. Tu peux lire.</p>
      )}
      {chat.error && (
        <p className={styles.error} role="alert">
          {chat.error}
        </p>
      )}
    </section>
  );
};
