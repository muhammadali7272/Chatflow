import { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { formatMessageTime, getInitials, getAvatarColor, getDisplayName } from '../../utils/helpers';
import { FiCheck, FiEdit2, FiTrash2, FiCopy, FiShare, FiAnchor, FiBookmark, FiCornerUpLeft } from 'react-icons/fi';

const MessageBubble = memo(({
  message,
  isOwn,
  user,
  onReply,
  onEdit,
  onDelete,
  onForward,
  onPin,
  onSave,
  showAvatar = true,
  showSender = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const initials = getInitials(getDisplayName(user));
  const avatarColor = getAvatarColor(user?._id || user?.id);
  // Support both the current backend shape (`text` / `read`) and the richer
  // legacy shape (`content` / `isSeen`) so this bubble stays reusable.
  const text = message.content ?? message.text ?? '';
  const isSeen = message.isSeen ?? message.read ?? (message.seenBy?.length > 0);
  const isEdited = message.edited;
  const isDeleted = message.deleted;
  const isPinned = message.pinned;
  const isForwarded = message.forwarded;

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setShowMenu(true);
    setTimeout(() => setShowMenu(false), 3000);
  }, []);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard?.writeText(text);
    setShowMenu(false);
  }, [text]);

  if (isDeleted) {
    return (
      <div className={`flex items-end gap-2 px-4 py-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[75%]">
          <div className={`px-4 py-2 rounded-xl ${isOwn ? 'bg-[var(--c-primary)]/20' : 'bg-[var(--c-surface-2)]/50'} border border-dashed border-[var(--c-border)]`}>
            <p className="text-xs text-[var(--c-text-muted)] italic">Message deleted</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-end gap-2 px-4 py-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onContextMenu={handleContextMenu}
    >
      {/* Avatar for others */}
      {!isOwn && showAvatar && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mb-1"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
      )}
      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

      {/* Message */}
      <div className="max-w-[75%] group relative">
        {/* Forwarded label */}
        {isForwarded && (
          <p className="text-[10px] text-[var(--c-primary)] font-medium mb-0.5 pl-1">Forwarded</p>
        )}

        {/* Sender name (for group chats) */}
        {showSender && !isOwn && (
          <p className="text-[11px] font-medium mb-0.5 pl-1" style={{ color: avatarColor }}>
            {getDisplayName(user)}
          </p>
        )}

        {/* Context menu */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`absolute ${isOwn ? 'right-0' : 'left-0'} -top-10 bg-[var(--c-input)] border border-[var(--c-border)] rounded-lg shadow-xl z-20 flex items-center gap-1 px-1 py-1`}
          >
            {onReply && (
              <button onClick={() => { onReply(message); setShowMenu(false); }} className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded transition-all" title="Reply">
                <FiCornerUpLeft size={14} />
              </button>
            )}
            {isOwn && onEdit && (
              <button onClick={() => { onEdit(message); setShowMenu(false); }} className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded transition-all" title="Edit">
                <FiEdit2 size={14} />
              </button>
            )}
            {isOwn && onDelete && (
              <button onClick={() => { onDelete(message._id || message.id); setShowMenu(false); }} className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-danger-text)] hover:bg-[var(--c-hover)] rounded transition-all" title="Delete">
                <FiTrash2 size={14} />
              </button>
            )}
            <button onClick={() => { copyToClipboard(); }} className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded transition-all" title="Copy">
              <FiCopy size={14} />
            </button>
            {onForward && (
              <button onClick={() => { onForward(message); setShowMenu(false); }} className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded transition-all" title="Forward">
                <FiShare size={14} />
              </button>
            )}
            {onPin && (
              <button onClick={() => { onPin(message._id || message.id, !isPinned); setShowMenu(false); }} className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded transition-all" title={isPinned ? 'Unpin' : 'Pin'}>
                <FiAnchor size={14} className={isPinned ? 'text-[var(--c-primary)]' : ''} />
              </button>
            )}
            {onSave && (
              <button onClick={() => { onSave(message); setShowMenu(false); }} className="p-1.5 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded transition-all" title="Save">
                <FiBookmark size={14} />
              </button>
            )}
          </motion.div>
        )}

        {/* Bubble */}
        <div
          className={`relative px-3 py-2 ${
            isOwn
              ? 'bg-[var(--c-bubble-mine)] text-[var(--c-bubble-mine-text)] rounded-lg rounded-br-sm'
              : 'bg-[var(--c-bubble-in)] text-[var(--c-bubble-other-text)] rounded-lg rounded-bl-sm'
          }`}
        >
          {/* Reply preview */}
          {message.replyTo && (
            <div className="mb-1.5 pl-2 border-l-2 border-[var(--c-primary)]">
              <p className="text-[10px] text-[var(--c-primary)] font-medium">
                {getDisplayName(message.replyTo.senderId)}
              </p>
              <p className="text-[11px] text-[var(--c-text-muted)] truncate max-w-[200px]">
                {message.replyTo.content}
              </p>
            </div>
          )}

          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {text}
          </p>

          {/* Pinned indicator */}
          {isPinned && (
            <div className="flex items-center gap-1 mt-1">
              <FiAnchor size={10} className="text-yellow-400 rotate-45" />
              <span className="text-[10px] text-yellow-400">Pinned</span>
            </div>
          )}

          {/* Time & status */}
          <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {/* Edited indicator */}
            {isEdited && (
              <span className={`text-[10px] ${isOwn ? 'text-[var(--c-bubble-mine-text)]/70' : 'text-[var(--c-text-muted)]'}`}>edited</span>
            )}
            <span className={`text-[10px] ${isOwn ? 'text-[var(--c-bubble-mine-text)]/80' : 'text-[var(--c-text-muted)]'}`}>
              {formatMessageTime(message.createdAt || message.timestamp)}
            </span>
            {isOwn && (
              <span className="relative">
                {isSeen ? (
                  // Read — two small overlapped green checks, Telegram-style
                  <span className="flex items-center" title="Seen">
                    <FiCheck size={12} className="text-green-300" />
                    <FiCheck size={12} className="text-green-300 -ml-[7px]" />
                  </span>
                ) : message._id?.toString().startsWith('temp_') ? (
                  <span className="text-[9px] text-[var(--c-bubble-mine-text)]/70">⏳</span>
                ) : (
                  // Sent, not read yet — one small gray check
                  <span className="flex items-center" title="Sent">
                    <FiCheck size={12} className="text-[var(--c-bubble-mine-text)]/55" />
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Quick actions on hover */}
        {onReply && showActions && !showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`absolute ${isOwn ? 'left-0 -translate-x-full pl-2' : 'right-0 translate-x-full pr-2'} top-1/2 -translate-y-1/2 flex items-center gap-0.5`}
          >              <button onClick={() => onReply?.(message)} className="p-1 text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors" title="Reply">
              <FiCornerUpLeft size={14} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Spacer for own messages (replaces avatar) */}
      {isOwn && <div className="w-8 flex-shrink-0" />}
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
