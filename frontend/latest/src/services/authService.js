import { initializeSocket, emitWithAck } from './socket';
import { SOCKET_EVENTS } from '../utils/constants';

// The sanjarb backend (prod/src/index.js) has no REST auth — login and
// register are socket events with ack callbacks (`auth:login` /
// `auth:register`), each returning `{success, user}` or
// `{success: false, message}`. No token/session of any kind is issued.
// The socket is initialized here (pre-auth, no userId yet) because these
// calls happen before the authenticated app shell mounts SocketProvider.

const authCall = async (event, payload) => {
  initializeSocket();
  const response = await emitWithAck(event, payload, { timeout: 15000 });
  if (!response?.success || !response.user) {
    throw new Error(response?.message || 'Something went wrong');
  }
  return response; // { success, user }
};

/**
 * Register a new user — email + password, no OTP step.
 */
export const registerUser = ({ firstName, lastName, age, email, password }) => {
  return authCall(SOCKET_EVENTS.AUTH_REGISTER, { firstName, lastName, age, email, password });
};

/**
 * Login with email and password.
 */
export const loginUser = ({ email, password }) => {
  return authCall(SOCKET_EVENTS.AUTH_LOGIN, { email, password });
};

export default {
  registerUser,
  loginUser,
};
