// Small per-device preferences kept in localStorage. Every access is guarded:
// storage can be unavailable (private mode, blocked site data).

const VIBRATION_KEY = 'dc:vibrations';
const LAST_GAME_KEY = 'dc:lastGame';
const CHANGE_EVENT = 'dc:prefs';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null): void => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Not saved: the default applies next time.
  }
};

export const canVibrate = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

/** Vibrations are on by default (one short pulse when your turn starts). */
export const vibrationsEnabled = (): boolean => read(VIBRATION_KEY) !== 'off';

export const setVibrationsEnabled = (enabled: boolean): void =>
  write(VIBRATION_KEY, enabled ? 'on' : 'off');

/** One short pulse, if the device can and the player didn't turn it off. */
export const vibrate = (pattern: number | number[] = 120): void => {
  if (!canVibrate() || !vibrationsEnabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers refuse before the first interaction: never mind.
  }
};

/** The last game this device played in, to offer "Retourne à ta partie". */
export const getLastGameId = (): string | null => read(LAST_GAME_KEY);

export const setLastGameId = (id: string | null): void => write(LAST_GAME_KEY, id);

export const PREFS_CHANGE_EVENT = CHANGE_EVENT;
