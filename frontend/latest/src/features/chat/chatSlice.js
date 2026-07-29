import { createSlice } from '@reduxjs/toolkit';

// Presence (online user ids + last-seen) lives in features/presence — this
// slice is messages-only.
const initialState = {
  messagesByUserId: {},
  selectedChatUserId: null,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      const { userId, messages } = action.payload;
      state.messagesByUserId[userId] = messages;
    },
    // The caller always knows which conversation this message belongs to
    // (either "who I just sent to" on my own send, or `chat:receive`'s
    // `from`) — no self-chat/room feature exists anymore to make that
    // ambiguous, so it's passed explicitly instead of inferred.
    addMessage: (state, action) => {
      const { otherUserId, message } = action.payload;
      if (!otherUserId) return;
      if (!state.messagesByUserId[otherUserId]) {
        state.messagesByUserId[otherUserId] = [];
      }
      const messages = state.messagesByUserId[otherUserId];

      // Replace an optimistic temp message with the server-ack'd real one.
      if (message._id && !String(message._id).startsWith('temp_')) {
        const tempIndex = messages.findIndex(
          (m) => String(m._id).startsWith('temp_') && m.text === message.text
        );
        if (tempIndex !== -1) {
          messages[tempIndex] = message;
          return;
        }
      }

      const exists = messages.some((m) => m._id === message._id);
      if (!exists) {
        messages.push(message);
      }
    },
    // Read-receipt bookkeeping, both directions of a 1:1 conversation:
    // markIncomingRead — I just read THEIR messages (fired alongside the
    // chat:read emit when the conversation is open/visible).
    // markOutgoingRead — THEY read MINE (server push `chat:read` { by }).
    markIncomingRead: (state, action) => {
      const otherUserId = action.payload;
      (state.messagesByUserId[otherUserId] || []).forEach((m) => {
        if (m.from === otherUserId) m.read = true;
      });
    },
    markOutgoingRead: (state, action) => {
      const otherUserId = action.payload;
      (state.messagesByUserId[otherUserId] || []).forEach((m) => {
        if (m.from !== otherUserId) m.read = true;
      });
    },
    setSelectedChatUserId: (state, action) => {
      state.selectedChatUserId = action.payload;
    },
    setChatLoading: (state, action) => {
      state.loading = action.payload;
    },
    setChatError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearChat: (state) => {
      state.messagesByUserId = {};
      state.selectedChatUserId = null;
    },
  },
});

export const {
  setMessages,
  addMessage,
  markIncomingRead,
  markOutgoingRead,
  setSelectedChatUserId,
  setChatLoading,
  setChatError,
  clearChat,
} = chatSlice.actions;

// Selectors
// Stable empty reference so useSelector doesn't see a new [] on every call for
// an empty/absent conversation (which would warn about unnecessary rerenders).
const EMPTY_MESSAGES = [];
export const selectMessagesByUser = (userId) => (state) => state.chat.messagesByUserId[userId] || EMPTY_MESSAGES;
export const selectSelectedChatUserId = (state) => state.chat.selectedChatUserId;
export const selectChatLoading = (state) => state.chat.loading;

export default chatSlice.reducer;
