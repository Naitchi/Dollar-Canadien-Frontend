import { useCallback, useEffect, useRef, useState } from 'react';

import { appendMessage } from '@/functions/functions';
import { getPusher } from '@/functions/pusher';
import { sendMessage } from '@/services/services';
import { ChatMessage, User } from '@/types/gameType';

// Quick replies can't be fired faster than this (the server allows 10
// messages per 10 s and per player).
const QUICK_REPLY_GAP_MS = 1500;

/**
 * The game's chat state. Owned by the game page so that it survives the
 * lobby → board → results transitions (messages are never stored anywhere:
 * remounting would wipe them). Ephemeral: everyone only sees the messages
 * sent since they arrived on the page.
 */
export const useChat = (gameId: string | null, user: User | null, me: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read by the Pusher handler, which is only bound once per game.
  const openRef = useRef(open);
  const meRef = useRef(me);
  const lastQuickReply = useRef(0);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  // Messages come through the game's Pusher channel. The page subscribes to
  // it (and unsubscribes when leaving): here we only add our own handler.
  useEffect(() => {
    if (!gameId) return;
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

  const send = useCallback(
    async (text: string, { keepDraft = false }: { keepDraft?: boolean } = {}): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || !user || !gameId || sending) return false;
      setSending(true);
      try {
        const message = await sendMessage(user, gameId, trimmed);
        setMessages((current) => appendMessage(current, message));
        if (!keepDraft) setDraft('');
        setError(null);
        return true;
      } catch (sendError) {
        setError((sendError as Error).message || "Le message n'est pas parti. Réessaie.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [user, gameId, sending],
  );

  /** One-tap reply, throttled client-side. Returns false when refused. */
  const quickReply = useCallback(
    (text: string): boolean => {
      const now = Date.now();
      if (now - lastQuickReply.current < QUICK_REPLY_GAP_MS || sending) {
        setError('Doucement ! Attends une seconde avant de renvoyer.');
        return false;
      }
      lastQuickReply.current = now;
      send(text, { keepDraft: true });
      return true;
    },
    [send, sending],
  );

  return { messages, open, setOpen, unread, draft, setDraft, sending, error, send, quickReply };
};

export type ChatState = ReturnType<typeof useChat>;
