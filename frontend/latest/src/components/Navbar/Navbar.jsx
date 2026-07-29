import { memo } from 'react';
import { motion } from 'framer-motion';
import { getInitials, getAvatarColor, getDisplayName } from '../../utils/helpers';
import { FiArrowLeft, FiPhone, FiVideo, FiSearch, FiMoreVertical, FiUsers, FiBookmark } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/I18nContext';
import StatusIndicator from '../StatusIndicator/StatusIndicator';

const Navbar = memo(({ user, isTyping, onlineUsers = [], onOpenInfo }) => {
  const navigate = useNavigate();
  const t = useTranslation();

  const isRoom = !!user?.isRoom;
  const isSaved = !!user?.isSaved;
  const members = isRoom ? (user.members || []) : [];
  const memberCount = members.length;
  const onlineCount = isRoom
    ? members.filter((m) => {
        const uid = m.user?._id || m.user?.id || m.user;
        return onlineUsers.includes(uid);
      }).length
    : 0;

  const title = isRoom ? (user.name || 'Group') : isSaved ? 'Saved Messages' : getDisplayName(user);
  const avatarColor = getAvatarColor(user?._id || user?.id);
  const initials = getInitials(title);

  const subtitle = isRoom
    ? `${memberCount} ${t('group.members')}${onlineCount > 0 ? `, ${onlineCount} ${t('chat.online')}` : ''}`
    : null;

  const clickable = !isSaved && typeof onOpenInfo === 'function';

  return (
    <div className="bg-[var(--c-surface-2)] border-b border-[var(--c-border)] px-4 py-2 flex items-center gap-3">
      {/* Back button for mobile */}
      <button
        onClick={() => navigate('/chat')}
        className="btn btn-ghost btn-sm btn-square md:hidden text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] transition-all duration-200 rounded-xl"
      >
        <FiArrowLeft size={20} />
      </button>

      {/* Avatar + info (clickable for groups → group info) */}
      <button
        type="button"
        onClick={clickable ? onOpenInfo : undefined}
        disabled={!clickable}
        className={`flex items-center gap-3 flex-1 min-w-0 text-left ${clickable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} transition-opacity`}
      >
        <div className="relative flex-shrink-0">
          {isRoom && user.avatar ? (
            <img src={user.avatar} alt={title} className="w-10 h-10 rounded-full object-cover" />
          ) : isRoom ? (
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white">
              <FiUsers size={18} />
            </div>
          ) : isSaved ? (
            <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-white">
              <FiBookmark size={16} />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}
          {!isRoom && !isSaved && (
            <StatusIndicator user={user} size="sm" ringColor="var(--c-surface-2)" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm text-[var(--c-text)] truncate">{title}</h2>
          <p className="text-[11px]">
            {isSaved ? (
              <span className="text-[var(--c-text-muted)]">Your personal space</span>
            ) : isTyping ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[var(--c-primary)] font-medium flex items-center gap-1"
              >
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-[var(--c-primary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[var(--c-primary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-[var(--c-primary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span className="ml-1">{t('chat.typing')}</span>
              </motion.span>
            ) : isRoom ? (
              <span className="text-[var(--c-text-muted)]">{subtitle}</span>
            ) : (
              <StatusIndicator user={user} variant="text" size="sm" />
            )}
          </p>
        </div>
      </button>

      {/* Action icons */}
      <div className="flex items-center gap-1">
        {!isRoom && !isSaved && (
          <>
            <button className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all" title="Voice Call">
              <FiPhone size={18} />
            </button>
            <button className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all" title="Video Call">
              <FiVideo size={18} />
            </button>
          </>
        )}
        <button className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all" title="Search in Chat">
          <FiSearch size={18} />
        </button>
        <button
          onClick={clickable ? onOpenInfo : undefined}
          className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all"
          title={isRoom ? t('group.info') : 'More'}
        >
          <FiMoreVertical size={18} />
        </button>
      </div>
    </div>
  );
});

Navbar.displayName = 'Navbar';

export default Navbar;
