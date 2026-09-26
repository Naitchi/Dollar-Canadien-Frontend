import { describe, expect, it } from 'vitest';

import clientReducer, { setClockOffset, setMe, setUser } from '@/store/slices/clientSlice';

describe('clientSlice', () => {
  const initial = clientReducer(undefined, { type: '@@INIT' });

  it('starts without a user nor a public id, trusting our own clock', () => {
    expect(initial).toEqual({ user: null, me: null, clockOffset: 0 });
  });

  it('keeps the user (secret) and our public id separately', () => {
    let state = clientReducer(initial, setUser({ id: 'secret', username: 'Alice' }));
    state = clientReducer(state, setMe('pub-1'));

    expect(state).toMatchObject({ user: { id: 'secret', username: 'Alice' }, me: 'pub-1' });
  });

  it('can forget our public id (we are not in the game)', () => {
    const state = clientReducer(clientReducer(initial, setMe('pub-1')), setMe(null));

    expect(state.me).toBeNull();
  });

  it('stores the offset between the server clock and ours', () => {
    const state = clientReducer(initial, setClockOffset(-1500));

    expect(state.clockOffset).toBe(-1500);
  });
});
