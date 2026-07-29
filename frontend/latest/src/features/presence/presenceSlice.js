import { createSlice } from '@reduxjs/toolkit';

// Centralised online/offline state. The single source of truth for presence
// across the app (chat list, chat header, profile panel, friends list). Fed by
// hooks/useSocket.js from the backend's single presence signal
// (prod/src/index.js): the `users:online` broadcast — a full snapshot array
// re-emitted on every announce and disconnect. `lastSeen` has no server
// source on this backend; StatusIndicator falls back to `user.lastSeen`
// when a populated user object happens to carry one.
// Not persisted (see store/persistConfig.js) — presence must always be fresh
// from the server after a reload, never restored stale from localStorage.
const initialState = {
  onlineUserIds: [],
  lastSeen: {}, // userId -> ISO date string (no live source on this backend)
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setOnlineUsers: (state, action) => {
      state.onlineUserIds = action.payload || [];
    },
    resetPresence: (state) => {
      state.onlineUserIds = [];
      state.lastSeen = {};
    },
  },
});

export const { setOnlineUsers, resetPresence } = presenceSlice.actions;

// Selectors — kept as narrow primitives so each StatusIndicator only re-renders
// when *its own* user's status actually changes.
export const selectOnlineUserIds = (state) => state.presence.onlineUserIds;
export const selectIsUserOnline = (userId) => (state) =>
  !!userId && state.presence.onlineUserIds.includes(userId);
export const selectLastSeen = (userId) => (state) =>
  userId ? state.presence.lastSeen[userId] : undefined;

export default presenceSlice.reducer;
