import { useEffect, useCallback, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';
import {
  setMessages,
  addMessage,
  markIncomingRead,
  selectMessagesByUser,
} from '../../features/chat/chatSlice';
import { clearUnread } from '../../features/users/usersSlice';
import { selectOnlineUserIds } from '../../features/presence/presenceSlice';
import { getChatHistory, sendChatMessage, markChatRead } from '../../services/chatService';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import MessageBubble from '../MessageBubble/MessageBubble';
import MessageInput from '../MessageInput/MessageInput';
import Navbar from '../Navbar/Navbar';
import UserProfile from '../UserProfile/UserProfile';
import { formatDateSeparator } from '../../utils/helpers';
import { FiMessageSquare } from 'react-icons/fi';
import { useTranslation } from '../../i18n/I18nContext';

// Direct-message only — the current backend (prod/src/start.js) supports just
// chat:history / chat:send / chat:receive on `{ from, to, text, read }`. No
// rooms, typing, edit/delete/pin/save or seen-receipts exist server-side, so
// none are wired here. Incoming messages are handled globally in
// hooks/useSocket.js (which also plays the sound/toast); this component only
// loads history and sends.
const ChatWindow = ({ selectedUser }) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const currentUser = useSelector(selectUser);
  const onlineUserIds = useSelector(selectOnlineUserIds);

  const selectedUserId = selectedUser?._id || null;
  const currentUserId = currentUser?._id || null;

  const messages = useSelector(selectMessagesByUser(selectedUserId));
  const { scrollRef, scrollToBottom } = useAutoScroll([messages, selectedUserId]);

  // Load the conversation history whenever the open chat changes, then mark
  // it read: the server flips the messages' `read` flag and pushes
  // `chat:read` to the sender; locally the same flip plus clearing the
  // sidebar unread badge.
  useEffect(() => {
    if (!selectedUserId || !currentUserId) return;
    let cancelled = false;
    getChatHistory(currentUserId, selectedUserId)
      .then((history) => {
        if (cancelled) return;
        dispatch(setMessages({ userId: selectedUserId, messages: history || [] }));
        markChatRead(currentUserId, selectedUserId);
        dispatch(markIncomingRead(selectedUserId));
        dispatch(clearUnread(selectedUserId));
      })
      .catch(() => {
        if (!cancelled) dispatch(setMessages({ userId: selectedUserId, messages: [] }));
      });
    return () => { cancelled = true; };
  }, [selectedUserId, currentUserId, dispatch]);

  const handleSendMessage = useCallback((text) => {
    if (!selectedUserId || !currentUserId) return;

    // Optimistic message using the backend field shape so chatSlice can swap
    // it for the server-ack'd one (it matches temp ↔ real by `text`).
    const optimistic = {
      _id: 'temp_' + Date.now(),
      from: currentUserId,
      to: selectedUserId,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    dispatch(addMessage({ otherUserId: selectedUserId, message: optimistic }));
    scrollToBottom(true);

    sendChatMessage(currentUserId, selectedUserId, text)
      .then((real) => {
        if (real) dispatch(addMessage({ otherUserId: selectedUserId, message: real }));
      })
      .catch(() => { /* toast is handled by the socket layer */ });
  }, [selectedUserId, currentUserId, dispatch, scrollToBottom]);

  // Group messages by calendar day for the date separators.
  const groupedMessages = useMemo(() => {
    const groups = {};
    messages.forEach((msg) => {
      const key = new Date(msg.createdAt).toDateString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    });
    return groups;
  }, [messages]);

  // The dot-pattern background is a static SVG data-URI, so its fill can't be
  // a CSS var — pick it from the active theme instead.
  const currentTheme = (typeof window !== 'undefined' ? localStorage.getItem('theme') : null) || 'dark';
  const patternFill = currentTheme === 'light' ? '%23081712' : '%23ffffff';

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--c-bg)]">
        <div className="text-center p-8 animate-fade-in">
          <div className="w-28 h-28 bg-[var(--c-surface-2)]/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMessageSquare className="text-5xl text-[var(--c-text-muted)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--c-text-muted)] mb-2">
            {t('chat.selectConversation')}
          </h3>
          <p className="text-sm text-[var(--c-text-muted)] max-w-xs">
            {t('chat.selectConversationSub')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--c-bg)]">
      {/* Chat background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${patternFill}' fill-opacity='0.4'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Navbar
        user={selectedUser}
        onlineUsers={onlineUserIds}
        onOpenInfo={() => setUserProfileOpen(true)}
      />

      <UserProfile
        isOpen={userProfileOpen}
        onClose={() => setUserProfileOpen(false)}
        user={selectedUser}
      />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2 relative z-10">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 animate-fade-in">
              <div className="w-16 h-16 bg-[var(--c-surface-2)]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiMessageSquare className="text-2xl text-[var(--c-text-muted)]" />
              </div>
              <p className="text-sm text-[var(--c-text-muted)]">
                {t('chat.noMessages')}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {Object.entries(groupedMessages).map(([dateKey, msgs]) => (
              <div key={dateKey}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-3">
                  <div className="bg-[var(--c-bubble-in)] px-3 py-1 rounded-lg">
                    <span className="text-[11px] text-[var(--c-text-muted)] font-medium">
                      {formatDateSeparator(msgs[0]?.createdAt)}
                    </span>
                  </div>
                </div>

                {msgs.map((msg, index) => {
                  const isOwn = msg.from === currentUserId;
                  const msgUser = isOwn ? currentUser : selectedUser;
                  const prevMsg = index > 0 ? msgs[index - 1] : null;
                  const showAvatar = !isOwn && (!prevMsg || prevMsg.from !== msg.from);

                  return (
                    <MessageBubble
                      key={msg._id || `msg-${index}`}
                      message={msg}
                      isOwn={isOwn}
                      user={msgUser}
                      currentUser={currentUser}
                      showAvatar={showAvatar}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <MessageInput onSendMessage={handleSendMessage} selectedUser={selectedUser} />
    </div>
  );
};

export default ChatWindow;
