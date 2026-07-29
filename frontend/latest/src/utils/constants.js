// Socket.io events — must mirror prod/src/index.js exactly (the entrypoint
// wired to `npm run dev`/`npm start` on the sanjarb backend branch). The
// whole API is socket-based: auth, contacts, search, notifications and chat
// all go through these events; the only REST left server-side is GET /.
// No JWT/session, no rooms, no typing indicators, no edit/delete/forward.
export const SOCKET_EVENTS = {
  AUTH_LOGIN: 'auth:login',
  AUTH_REGISTER: 'auth:register',

  USER_ONLINE: 'user:online',
  USERS_ONLINE: 'users:online',

  CONTACTS_LIST: 'contacts:list',
  CONTACTS_ADD: 'contacts:add',
  CONTACTS_ADDED: 'contacts:added',
  USERS_SEARCH: 'users:search',

  NOTIFICATIONS_LIST: 'notifications:list',
  NOTIFICATIONS_READ: 'notifications:read',
  NOTIFICATION_NEW: 'notification:new',

  CHAT_HISTORY: 'chat:history',
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  CHAT_READ: 'chat:read',
};

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
export const API_URL = `${SERVER_URL}/api`;

export const VALIDATION = {
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  AGE_MIN: 12,
  AGE_MAX: 120,
};

export const COLORS = {
  PRIMARY: '#10b981',
  SECONDARY: '#14b8a6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
};
