import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface User {
  id: string;
  username: string;
}

interface PusherState {
  user: User | null;
}

const initialState: PusherState = {
  user: null,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      state.user = user;
    },
  },
});

export const getUser = (state: RootState) => state.client.user;

export const { setUser } = clientSlice.actions;

export default clientSlice.reducer;
