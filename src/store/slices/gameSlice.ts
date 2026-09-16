import { Game, Player } from '@/types/gameType';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PusherState {
  game: Game | null;
}

const initialState: PusherState = {
  game: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    updatePlayer: (state, action: PayloadAction<Partial<Player> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const index = state.game?.players.findIndex((player) => player._id === id);
      if (index !== undefined && index !== -1 && state.game?.players) {
        state.game.players[index] = {
          ...state.game?.players[index],
          ...updates,
        };
      }
    },
    updatePlayers: (state, action: PayloadAction<Player[]>) => {
      if (state.game?.players) {
        state.game.players = action.payload;
      }
    },
    setGame: (state, action: PayloadAction<Game>) => {
      const game = action.payload;
      state.game = game;
    },
    removePlayer(state, action: PayloadAction<string>) {
      if (state.game?.players) {
        state.game.players = state.game.players.filter((player) => player._id !== action.payload);
      }
    },
  },
});

export const selectActivePlayer = (state: PusherState) =>
  state.game?.players.find((player) => player._id === state.game?.actif) || null;

export const { updatePlayers, updatePlayer, removePlayer, setGame } = gameSlice.actions;

export default gameSlice.reducer;
