import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Functions
import { appendMessage, playerColor } from '@/functions/functions';
import { getPusher } from '@/functions/pusher';

// Services
import { sendMessage } from '@/services/services';

// Store
import { getMe, getUser } from '@/store/slices/clientSlice';
import { RootState } from '@/store/store';

// Types
import { ChatMessage } from '@/types/gameType';

// Styles
import styles from './Chat.module.css';

// Same limit as MAX_MESSAGE_LENGTH in the backend (functions/chat.js).
const MAX_MESSAGE_LENGTH = 200;

const formatTime = (sentAt: string) =>
  new Date(sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

interface ChatProps {
  gameId: string;
}

// Floating chat of the game, from the lobby to the results screen. Only the
// players of the lobby can write. Ephemeral: nothing is stored, so everyone
// only sees the messages sent since they arrived on the page.
const Chat: React.FC<ChatProps> = ({ gameId }) => {
  const user = useSelector(getUser);
  const me = useSelector(getMe);
  const players = useSelector((state: RootState) => state.game.game?.players);
  const isPlayer = !!me && !!players?.some((player) => player._id === me);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read by the Pusher handler, which is only bound once.
  const openRef = useRef(open);
  const meRef = useRef(me);
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setUnread(0);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  // Messages come through the game's Pusher channel. The page subscribes to
  // it (and unsubscribes when leaving): here we only add our own handler.
  useEffect(() => {
    setMessages([]);
    setUnread(0);
    const channel = getPusher().subscribe(`DollarCanadien-${gameId}`);
    const handleMessage = (message: ChatMessage) => {
      setMessages((current) => appendMessage(current, message));
      if (!openRef.current && message.playerId !== meRef.current) {
        setUnread((count) => count + 1);
      }
    };
    channel.bind('chatMessage', handleMessage);
    return () => {
      channel.unbind('chatMessage', handleMessage);
    };
  }, [gameId]);

  // Always show the latest message.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !user || sending) return;

    setSending(true);
    try {
      const message = await sendMessage(user, gameId, text);
      setMessages((current) => appendMessage(current, message));
      setDraft('');
      setError(null);
    } catch (sendError) {
      setError((sendError as Error).message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    <div className={styles.chat}>
      {open && (
        <section className={styles.panel} aria-label="Chat de la partie" onKeyDown={closeOnEscape}>
          <header className={styles.header}>
            <h2 className={styles.title}>Chat</h2>
            <button
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Fermer le chat"
            >
              ✕
            </button>
          </header>
          <ol className={styles.messages} ref={listRef} aria-live="polite">
            {messages.length === 0 && (
              <li className={styles.empty}>
                Aucun message pour l&apos;instant. Rien n&apos;est gardé : tu ne vois que les
                messages envoyés depuis ton arrivée.
              </li>
            )}
            {messages.map((message) => (
              <li
                key={message.id}
                className={`${styles.message} ${message.playerId === me ? styles.mine : ''}`}
              >
                <span className={styles.author} style={{ color: playerColor(message.playerId) }}>
                  {message.username}
                </span>
                <span className={styles.text}>{message.text}</span>
                <time className={styles.time} dateTime={message.sentAt}>
                  {formatTime(message.sentAt)}
                </time>
              </li>
            ))}
          </ol>
          {isPlayer ? (
            <form className={styles.form} onSubmit={send}>
              <input
                ref={inputRef}
                className={styles.input}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Écris un message…"
                aria-label="Message"
              />
              <button className={styles.send} type="submit" disabled={!draft.trim() || sending}>
                Envoyer
              </button>
            </form>
          ) : (
            <p className={styles.hint}>Rejoins la partie pour écrire.</p>
          )}
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </section>
      )}
      <button
        className={styles.toggle}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        💬
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
      </button>
    </div>
  );
};

export default Chat;
