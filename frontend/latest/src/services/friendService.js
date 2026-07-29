import { emitWithAck, onEvent, offEvent } from './socket';
import { SOCKET_EVENTS } from '../utils/constants';

// Contacts & notifications boundary for the sanjarb backend
// (prod/src/index.js). Everything is socket-based; the old REST
// /api/users/* routes and the ephemeral friend_request:* events no longer
// exist. `contacts:add` is mutual and idempotent ($addToSet on both sides),
// so there is no "already in your contacts" error case anymore.

/**
 * Search the user directory by email/name (`users:search`, min 1 char —
 * an empty query returns []).
 */
export const searchUsers = async (currentUserId, query) => {
  const response = await emitWithAck(SOCKET_EVENTS.USERS_SEARCH, { currentUserId, query });
  if (!response?.success) throw new Error('Search failed');
  return response.users; // [{ _id, firstName, lastName, email }]
};

/**
 * Add a contact — mutual: the server $addToSets each user into the other's
 * contacts, notifies the target in real time (`contacts:added` +
 * `notification:new`) and returns the added contact's user object.
 */
export const addContact = async (userId, targetId) => {
  const response = await emitWithAck(SOCKET_EVENTS.CONTACTS_ADD, { userId, targetId });
  if (!response?.success) throw new Error(response?.message || 'Failed to add contact');
  return response.contact; // { _id, firstName, lastName, email }
};

/**
 * My notifications (persisted server-side, newest first, max 50).
 */
export const fetchNotifications = async (userId) => {
  const response = await emitWithAck(SOCKET_EVENTS.NOTIFICATIONS_LIST, userId);
  if (!response?.success) throw new Error('Failed to load notifications');
  return response; // { notifications, unreadCount }
};

/**
 * Mark all my notifications as read.
 */
export const markNotificationsRead = async (userId) => {
  const response = await emitWithAck(SOCKET_EVENTS.NOTIFICATIONS_READ, userId);
  if (!response?.success) throw new Error('Failed to mark notifications read');
};

/**
 * Someone added me to their contacts (payload = their user object). Fired
 * both on explicit `contacts:add` and on the first message of a new chat.
 */
export const onContactAdded = (callback) => {
  onEvent(SOCKET_EVENTS.CONTACTS_ADDED, callback);
  return () => offEvent(SOCKET_EVENTS.CONTACTS_ADDED, callback);
};

/**
 * A new persisted notification for me — payload { _id, type, read,
 * createdAt, from: user }.
 */
export const onNotificationNew = (callback) => {
  onEvent(SOCKET_EVENTS.NOTIFICATION_NEW, callback);
  return () => offEvent(SOCKET_EVENTS.NOTIFICATION_NEW, callback);
};
