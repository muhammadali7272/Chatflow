import { io } from 'socket.io-client';
import { SERVER_URL } from '../utils/constants';

let socket = null;
let reconnectTimer = null;

/**
 * Initialize socket connection. Identity is sent in the handshake auth payload
 * (`socket.handshake.auth.userId` on the server) so the backend knows who
 * connected at connection time — the basis for presence. For backward
 * compatibility the client also still emits `user:online` after connecting
 * (see hooks/useSocket.js); there is no token/JWT in this app to send.
 */
export const initializeSocket = (userId) => {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SERVER_URL, {
    auth: userId ? { userId } : {},
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log(`[socket] connected to ${SERVER_URL} (id: ${socket.id})`);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    // Reconnect attempts are automatic
    console.warn(`[socket] connect_error: ${error.message}`);
  });

  socket.on('reconnect', (attempt) => {
    console.log(`[socket] reconnected after ${attempt} attempt(s)`);
  });

  if (import.meta.env.DEV) {
    socket.onAny((event) => {
      console.log(`[socket] received: ${event}`);
    });
  }

  socket.on('reconnect_failed', () => {
    // Retry after 10 seconds
    reconnectTimer = setTimeout(() => {
      if (socket && !socket.connected) {
        socket.connect();
      }
    }, 10000);
  });

  return socket;
};

/**
 * Get current socket instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit an event with data
 */
export const emitEvent = (event, data) => {
  if (!socket) return;
  // socket.io buffers packets emitted before the handshake completes and
  // flushes them on connect. Gating on `connected` here dropped them
  // instead, so anything a page emitted on mount — while the socket was
  // still connecting — was lost, and its reply never came.
  if (import.meta.env.DEV) console.log(`[socket] emit: ${event}`);
  socket.emit(event, data);
};

/**
 * Emit an event and resolve with the server's ack callback response.
 * Packets emitted before the handshake completes are buffered by socket.io
 * and flushed on connect, so this is safe to call while still connecting —
 * the timeout covers the "server unreachable" case.
 */
export const emitWithAck = (event, payload, { timeout = 10000 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error('Socket not initialized'));
    const timer = setTimeout(
      () => reject(new Error('Server did not respond. Please try again.')),
      timeout
    );
    if (import.meta.env.DEV) console.log(`[socket] emit (ack): ${event}`);
    socket.emit(event, payload, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
};

/**
 * Listen for an event
 */
export const onEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Remove listener for an event
 */
export const offEvent = (event, callback) => {
  if (socket) {
    if (callback) {
      socket.off(event, callback);
    } else {
      socket.off(event);
    }
  }
};

/**
 * Remove all listeners
 */
export const removeAllListeners = () => {
  if (socket) {
    socket.removeAllListeners();
  }
};

/**
 * Check if socket is connected
 */
export const isConnected = () => {
  return socket && socket.connected;
};

/**
 * Wait for connection
 */
export const waitForConnection = (timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (socket?.connected) return resolve();
    const start = Date.now();
    const check = setInterval(() => {
      if (socket?.connected) {
        clearInterval(check);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(check);
        reject(new Error('Socket connection timeout'));
      }
    }, 100);
  });
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  emitEvent,
  emitWithAck,
  onEvent,
  offEvent,
  removeAllListeners,
  isConnected,
  waitForConnection,
};
