import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiMessageCircle, FiUserPlus } from 'react-icons/fi';
import { getInitials, getAvatarColor, getDisplayName } from '../../utils/helpers';
import { addContact } from '../../services/friendService';
import { upsertContact } from '../../features/users/usersSlice';
import { useTranslation } from '../../i18n/I18nContext';
import StatusIndicator from '../StatusIndicator/StatusIndicator';

// A single "discover people" row. `contacts:add` on the sanjarb backend is
// mutual and idempotent ($addToSet both sides), so there is no "already in
// contacts" failure mode; the ack returns the added user object, which goes
// straight into the contact list — the row disappears from discovery and the
// sidebar shows it immediately, no refetch.
const DiscoveryCard = ({ user, currentUserId, isOnline, onAdded }) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const uid = user._id;
  const name = getDisplayName(user);
  const initials = getInitials(name);
  const avatarColor = getAvatarColor(uid);

  const add = useCallback(async () => {
    const contact = await addContact(currentUserId, uid);
    dispatch(upsertContact(contact || user));
  }, [currentUserId, uid, user, dispatch]);

  const handleAdd = useCallback(async () => {
    setBusy(true);
    try {
      await add();
      toast.success(t('friends.addedToContacts'));
      onAdded?.(uid);
    } catch (err) {
      toast.error(err?.message || t('friends.addFailed'));
      setBusy(false);
    }
  }, [add, uid, onAdded, t]);

  // Chat.jsx resolves the conversation partner from the contact list, so the
  // add must land before navigating.
  const handleMessage = useCallback(async () => {
    setBusy(true);
    try {
      await add();
      navigate(`/chat/${uid}`);
    } catch (err) {
      toast.error(err?.message || t('friends.addFailed'));
      setBusy(false);
    }
  }, [add, uid, navigate, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3 mx-1 rounded-xl hover:bg-[var(--c-hover)] transition-all duration-200"
    >
      <div className="relative flex-shrink-0">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <StatusIndicator user={user} size="md" ringColor="var(--c-surface)" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm text-[var(--c-text)] truncate">{name}</h3>
        <p className="text-[11px] text-[var(--c-text-muted)] truncate mt-0.5">
          {isOnline ? t('friends.online') : (user.email || '')}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleMessage}
          disabled={busy}
          title={t('friends.message')}
          className="p-2 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-input)] disabled:opacity-50 transition-all"
        >
          <FiMessageCircle size={16} />
        </button>
        <button
          onClick={handleAdd}
          disabled={busy}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white disabled:opacity-50 transition-colors flex items-center gap-1"
        >
          <FiUserPlus size={12} />
          {t('friends.add')}
        </button>
      </div>
    </motion.div>
  );
};

export default DiscoveryCard;
