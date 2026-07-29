import { emitEvent, emitWithAck, onEvent, offEvent } from './socket';
import { SOCKET_EVENTS } from '../utils/constants';

/**
 * Announce presence — the only way the backend learns you're online (no
 * auth handshake in prod/src/index.js). Call once per connect.
 */
export const emitUserOnline = (userId) => {
  emitEvent(SOCKET_EVENTS.USER_ONLINE, userId);
};

/**
 * My contact list, server-truth (`contacts:list`) — populated user objects
 * each carrying an `unreadCount` of messages they sent me that I haven't
 * read yet. This replaces the old client-side derivation from the persisted
 * auth.user.contacts array.
 */
export const fetchContacts = async (userId) => {
  const response = await emitWithAck(SOCKET_EVENTS.CONTACTS_LIST, userId);
  if (!response?.success) throw new Error('Failed to load contacts');
  return response.contacts; // [{ _id, firstName, lastName, email, unreadCount }]
};

/**
 * Chat history with a specific user (messages include `read`).
 */
export const getChatHistory = async (from, to) => {
  const response = await emitWithAck(SOCKET_EVENTS.CHAT_HISTORY, { from, to });
  if (!response?.success) throw new Error('Failed to load chat history');
  return response.messages;
};

/**
 * Send a text message. Server-side this also adds both users to each
 * other's contacts ($addToSet) and pushes `contacts:added` for new chats.
 */
export const sendChatMessage = async (from, to, text) => {
  const response = await emitWithAck(SOCKET_EVENTS.CHAT_SEND, { from, to, text });
  if (!response?.success) throw new Error('Failed to send message');
  return response.message;
};

/**
 * Mark everything `fromUserId` sent me as read. The server flips the
 * messages' `read` flag and notifies the sender with `chat:read` ({ by }).
 * Fire-and-forget — a lost ack must not block the UI.
 */
export const markChatRead = (userId, fromUserId) => {
  emitEvent(SOCKET_EVENTS.CHAT_READ, { userId, fromUserId });
};

/**
 * Listen for incoming messages.
 */
export const onChatReceive = (callback) => {
  onEvent(SOCKET_EVENTS.CHAT_RECEIVE, callback);
  return () => offEvent(SOCKET_EVENTS.CHAT_RECEIVE, callback);
};

/**
 * Listen for "the other side read my messages" — payload { by: userId }.
 */
export const onChatRead = (callback) => {
  onEvent(SOCKET_EVENTS.CHAT_READ, callback);
  return () => offEvent(SOCKET_EVENTS.CHAT_READ, callback);
};
