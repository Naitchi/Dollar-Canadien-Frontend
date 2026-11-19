import { ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type Politeness = 'polite' | 'assertive';

type Announce = (message: string, politeness?: Politeness) => void;

const AnnouncerContext = createContext<Announce>(() => {});

/**
 * Screen-reader announcements for game events (turn start, throws, score,
 * damage, eliminations, connection, errors). The two live regions always
 * exist, so messages are read even when they're the first thing to change.
 */
export const AnnouncerProvider = ({ children }: { children: ReactNode }) => {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  // Alternates an invisible character so that the same message twice in a
  // row is still announced.
  const toggle = useRef(false);

  const announce = useCallback<Announce>((message, politeness = 'polite') => {
    toggle.current = !toggle.current;
    const text = message + (toggle.current ? '​' : '');
    if (politeness === 'assertive') setAssertive(text);
    else setPolite(text);
  }, []);

  const value = useMemo(() => announce, [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
};

export const useAnnounce = (): Announce => useContext(AnnouncerContext);
