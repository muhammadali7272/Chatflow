import { SOCKET_EVENTS } from '../utils/constants';
import { onEvent, offEvent } from './socket';

// Presence boundary for prod/src/index.js. The backend's only presence
// signal is the `users:online` broadcast — the full array of online user
// ids, re-emitted on every `user:online` announce and on every disconnect.
// There are no granular user:online/user:offline push events and no REST
// snapshot route, so this one subscription is the entire presence feed.

/**
 * Subscribe to the online-users snapshot — payload: array of user ids.
 * Returns an unsubscribe function (call it in a useEffect cleanup).
 */
export const onUsersOnline = (callback) => {
  onEvent(SOCKET_EVENTS.USERS_ONLINE, callback);
  return () => offEvent(SOCKET_EVENTS.USERS_ONLINE, callback);
};
