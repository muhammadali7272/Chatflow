import { memo } from 'react';
import { motion } from 'framer-motion';
import { getInitials, getAvatarColor, getDisplayName, formatMessageTime, truncateText } from '../../utils/helpers';
import StatusIndicator from '../StatusIndicator/StatusIndicator';

const ContactItem = memo(({ user, isSelected, lastMessage, unreadCount = 0, onClick }) => {
  const initials = getInitials(getDisplayName(user));
  const avatarColor = getAvatarColor(user._id);

  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`group flex items-center gap-3 p-3 cursor-pointer transition-all duration-200 mx-1 rounded-lg relative ${
        isSelected
          ? 'bg-[var(--c-bubble-mine)]'
          : 'hover:bg-[var(--c-hover)]'
      }`}
    >
      {/* Avatar with online indicator */}
      <div className="relative flex-shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <StatusIndicator user={user} size="md" ringColor="var(--c-surface)" />
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={`font-medium text-sm truncate ${isSelected ? 'keep-on-accent' : 'text-[var(--c-text)]'} transition-colors duration-200`}>
            {getDisplayName(user)}
          </h3>
          {lastMessage && (
            <span className={`text-[11px] whitespace-nowrap ${isSelected ? 'keep-on-accent opacity-80' : 'text-[var(--c-text-muted)]'}`}>
              {formatMessageTime(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-xs truncate ${
            isSelected ? 'keep-on-accent opacity-80' : lastMessage ? 'text-[var(--c-text-muted)]' : 'text-[var(--c-text-muted)] italic'
          }`}>
            {lastMessage ? truncateText(lastMessage.text, 40) : 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--c-primary)] text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ContactItem.displayName = 'ContactItem';

export default ContactItem;
