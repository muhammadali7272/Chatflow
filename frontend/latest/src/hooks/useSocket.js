import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeSocket, disconnectSocket, getSocket, emitEvent, onEvent, offEvent } from '../services/socket';
import { selectIsAuthenticated, selectUser } from '../features/auth/authSlice';
import { addMessage, markIncomingRead, markOutgoingRead, selectSelectedChatUserId } from '../features/chat/chatSlice';
import { setOnlineUsers, resetPresence } from '../features/presence/presenceSlice';
import { upsertContact, incrementUnread, clearUnread } from '../features/users/usersSlice';
import { emitUserOnline, onChatReceive, onChatRead, markChatRead } from '../services/chatService';
import { onUsersOnline } from '../services/presenceService';
import { onContactAdded, onNotificationNew } from '../services/friendService';
import { getDisplayName } from '../utils/helpers';
import { playMessageSound } from '../utils/notificationSound';
import toast from 'react-hot-toast';

// Every listener here mirrors an event that actually exists in
// prod/src/index.js (the sanjarb backend): users:online snapshots,
// chat:receive / chat:read, contacts:added and notification:new. No rooms,
// typing, edit/delete/pin/save — none of that is implemented server-side.
export const useSocket = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectUser);
  const selectedChatUserId = useSelector(selectSelectedChatUserId);
  const listenersSetRef = useRef(false);
  // The listeners below are only (re)registered once per connection, so
  // they close over stale state — read the currently-open chat through a
  // ref that's always kept up to date instead.
  const selectedChatRef = useRef(selectedChatUserId);

  useEffect(() => {
    selectedChatRef.current = selectedChatUserId;
  }, [selectedChatUserId]);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      dispatch(resetPresence());
      listenersSetRef.current = false;
      return;
    }

    const socket = initializeSocket(currentUser?._id);

    const setupListeners = () => {
      if (listenersSetRef.current) return;
      listenersSetRef.current = true;

      // Full online snapshot — the backend's only presence signal,
      // re-broadcast on every announce and disconnect.
      const cleanupUsersOnline = onUsersOnline((userIds) => {
        dispatch(setOnlineUsers(userIds || []));
      });

      const cleanupReceive = onChatReceive((message) => {
        const otherUserId = message.from;
        dispatch(addMessage({ otherUserId, message }));

        const currentUserId = currentUser?._id;
        if (otherUserId === currentUserId) return;

        const openChatId = selectedChatRef.current;
        const isChatOpenAndVisible = openChatId === otherUserId && !document.hidden;
        if (isChatOpenAndVisible) {
          // Chat open and on screen — read instantly: tell the sender's
          // side (server flips `read` + pushes chat:read) and flip local.
          if (currentUserId) markChatRead(currentUserId, otherUserId);
          dispatch(markIncomingRead(otherUserId));
          dispatch(clearUnread(otherUserId));
          return;
        }

        dispatch(incrementUnread(otherUserId));
        playMessageSound(message._id);
        toast(`New message: ${message.text}`);

        if (document.hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('New message', { body: message.text, tag: message.from });
        }
      });

      // The other side read my messages — payload { by: userId }.
      const cleanupRead = onChatRead(({ by }) => {
        if (by) dispatch(markOutgoingRead(by));
      });

      // Someone added me (explicit contacts:add, or auto-add on the first
      // message of a new chat) — payload is their user object. The toast
      // for the explicit case comes via notification:new, so stay silent
      // here and just keep the sidebar list live.
      const cleanupContactAdded = onContactAdded((user) => {
        dispatch(upsertContact(user));
      });

      const cleanupNotification = onNotificationNew((notification) => {
        if (notification?.type === 'friend_add') {
          toast(`${getDisplayName(notification.from)} added you to their contacts`, { icon: '👋' });
        }
      });

      onEvent('error', (error) => {
        toast.error(error.message || 'An error occurred');
      });

      listenersSetRef.current = {
        cleanupUsersOnline, cleanupReceive, cleanupRead,
        cleanupContactAdded, cleanupNotification,
      };
    };

    const handleConnect = () => {
      setupListeners();
      // The only identity the backend has for this socket — re-announced on
      // every (re)connect so presence survives reconnects.
      if (currentUser?._id) emitUserOnline(currentUser._id);
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    return () => {
      const cleanups = listenersSetRef.current;
      if (cleanups && typeof cleanups === 'object') {
        cleanups.cleanupUsersOnline?.();
        cleanups.cleanupReceive?.();
        cleanups.cleanupRead?.();
        cleanups.cleanupContactAdded?.();
        cleanups.cleanupNotification?.();
      }
      offEvent('error');
      socket.off('connect', handleConnect);
      listenersSetRef.current = false;
    };
  }, [isAuthenticated, currentUser?._id, dispatch]);

  const emit = useCallback((event, data) => {
    emitEvent(event, data);
  }, []);

  return {
    socket: getSocket(),
    isConnected: getSocket()?.connected || false,
    emit,
  };
};
