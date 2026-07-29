import { createSlice } from '@reduxjs/toolkit';

// Friend requests are purely ephemeral live pings (see prod/src/start.js) —
// nothing is persisted server-side, so there's no pending-request list to
// keep in sync here. This slice only tracks the most recent incoming
// request for the current session, for a toast/banner; useSocket.js is the
// source of truth for handling the live events.
const initialState = {
  lastReceivedRequest: null,
};

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    setLastReceivedRequest: (state, action) => {
      state.lastReceivedRequest = action.payload;
    },
    clearLastReceivedRequest: (state) => {
      state.lastReceivedRequest = null;
    },
  },
});

export const { setLastReceivedRequest, clearLastReceivedRequest } = friendsSlice.actions;

// Selectors
export const selectLastReceivedRequest = (state) => state.friends.lastReceivedRequest;

export default friendsSlice.reducer;
