import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPhone, FiClock, FiAtSign } from 'react-icons/fi';
import { selectIsUserOnline, selectLastSeen } from '../../features/presence/presenceSlice';
import { getInitials, getAvatarColor, getDisplayName, formatRelativeTime } from '../../utils/helpers';
import { useI18n } from '../../i18n/I18nContext';
import StatusIndicator from '../StatusIndicator/StatusIndicator';

/**
 * Read-only "public profile" view of another user — avatar, bio, phone (if
 * they've made it visible), online/last-seen (live from the presence slice).
 * No add-friend button: this panel only opens from an active conversation,
 * and on the sanjarb backend anyone you chat with is already a mutual
 * contact (contacts:add / first message both $addToSet each side).
 */
const UserProfile = ({ isOpen, onClose, user }) => {
  const { t, lang } = useI18n();
  const userId = user?._id || user?.id;
  const isOnline = useSelector(selectIsUserOnline(userId));
  const lastSeen = useSelector(selectLastSeen(userId)) || user?.lastSeen || null;

  if (!user) return null;

  const initials = getInitials(getDisplayName(user));
  const avatarColor = getAvatarColor(userId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-[var(--c-surface)] border-l border-[var(--c-border)] shadow-2xl z-50 flex flex-col"
          >
            <div className="px-5 py-4 flex items-center justify-between bg-[var(--c-surface-2)]">
              <h2 className="text-[var(--c-text)] font-semibold text-lg">Profile</h2>
              <button onClick={onClose} className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt={getDisplayName(user)} className="w-24 h-24 rounded-full object-cover ring-2 ring-[var(--c-border)]" />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl ring-2 ring-[var(--c-border)]"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initials}
                    </div>
                  )}
                  <StatusIndicator user={user} size="lg" ringColor="var(--c-surface)" />
                </div>
                <h3 className="mt-3 text-center text-[var(--c-text)] font-semibold text-lg">{getDisplayName(user)}</h3>
                <StatusIndicator user={user} variant="text" size="sm" className="mt-0.5 text-xs" />
              </div>

              <div className="space-y-4">
                {user.username && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-input)]">
                    <FiAtSign size={16} className="text-[var(--c-text-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--c-text-muted)]">Username</p>
                      <p className="text-sm text-[var(--c-text)] truncate">@{user.username}</p>
                    </div>
                  </div>
                )}

                {user.bio && (
                  <div className="p-3 rounded-xl bg-[var(--c-input)]">
                    <p className="text-[11px] text-[var(--c-text-muted)] mb-1">Bio</p>
                    <p className="text-sm text-[var(--c-text)] whitespace-pre-wrap break-words">{user.bio}</p>
                  </div>
                )}

                {user.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-input)]">
                    <FiPhone size={16} className="text-[var(--c-text-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--c-text-muted)]">Phone</p>
                      <p className="text-sm text-[var(--c-text)] truncate">{user.phone}</p>
                    </div>
                  </div>
                )}

                {!isOnline && lastSeen && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-input)]">
                    <FiClock size={16} className="text-[var(--c-text-muted)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-[var(--c-text-muted)]">{t('status.lastSeen')}</p>
                      <p className="text-sm text-[var(--c-text)] truncate">{formatRelativeTime(lastSeen, lang)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfile;
