import { createSlice } from '@reduxjs/toolkit';

// Server-truth contact list from `contacts:list` (prod/src/index.js):
// populated user objects, each with an `unreadCount` of messages they sent
// me that I haven't read. Kept live between refetches by `contacts:added`
// (→ upsertContact) and chat events (→ incrementUnread / clearUnread).
// Deliberately NOT persisted — refetched on every session so it can never
// go stale the way the old client-derived list did.
const initialState = {
  contacts: [],
  loading: false,
  error: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setContacts: (state, action) => {
      state.contacts = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    // Add a contact we just learned about (contacts:add ack or a live
    // contacts:added push). No-op if already present.
    upsertContact: (state, action) => {
      const contact = action.payload;
      if (!contact?._id) return;
      if (!state.contacts.some((c) => c._id === contact._id)) {
        state.contacts.push({ unreadCount: 0, ...contact });
      }
    },
    incrementUnread: (state, action) => {
      const contact = state.contacts.find((c) => c._id === action.payload);
      if (contact) contact.unreadCount = (contact.unreadCount || 0) + 1;
    },
    clearUnread: (state, action) => {
      const contact = state.contacts.find((c) => c._id === action.payload);
      if (contact) contact.unreadCount = 0;
    },
    setUsersLoading: (state, action) => {
      state.loading = action.payload;
    },
    setUsersError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearUsers: (state) => {
      state.contacts = [];
    },
  },
});

export const {
  setContacts,
  upsertContact,
  incrementUnread,
  clearUnread,
  setUsersLoading,
  setUsersError,
  clearUsers,
} = usersSlice.actions;

// Selectors
export const selectContacts = (state) => state.users.contacts;
export const selectUsersLoading = (state) => state.users.loading;
export const selectUsersError = (state) => state.users.error;

export default usersSlice.reducer;
