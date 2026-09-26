import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { User } from '@/types/gameType';

interface PusherState {
  user: User | null;
  // Our public player id in the current game (null if we're not in it). Use
  // this, never `user.id` (our secret), to recognize ourselves in the game.
  me: string | null;
  // Server clock minus ours (ms), so that deadlines sent by the server can be
  // compared with our own clock even if it's off.
  clockOffset: number;
}

const initialState: PusherState = {
  user: null,
  me: null,
  clockOffset: 0,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      state.user = user;
    },
    setMe: (state, action: PayloadAction<string | null>) => {
      state.me = action.payload;
    },
    setClockOffset: (state, action: PayloadAction<number>) => {
      state.clockOffset = action.payload;
    },
  },
});

export const getUser = (state: RootState) => state.client.user;
export const getMe = (state: RootState) => state.client.me;
export const getClockOffset = (state: RootState) => state.client.clockOffset;

export const { setUser, setMe, setClockOffset } = clientSlice.actions;

export default clientSlice.reducer;
