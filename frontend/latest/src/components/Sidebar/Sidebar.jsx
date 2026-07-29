import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { selectUser, logout } from '../../features/auth/authSlice';
import { selectContacts, setContacts } from '../../features/users/usersSlice';
import { selectOnlineUserIds } from '../../features/presence/presenceSlice';
import { fetchContacts } from '../../services/chatService';
import ContactItem from '../ContactItem/ContactItem';
import StatusIndicator from '../StatusIndicator/StatusIndicator';
import Drawer from '../Drawer/Drawer';
import { getInitials, getAvatarColor, getDisplayName } from '../../utils/helpers';
import { disconnectSocket } from '../../services/socket';
import { useTranslation } from '../../i18n/I18nContext';
import { FiSearch, FiLogOut, FiMessageSquare, FiMenu, FiX, FiUserPlus } from 'react-icons/fi';

const Sidebar = () => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: urlUserId } = useParams();
  const currentUser = useSelector(selectUser);
  const allContacts = useSelector(selectContacts);
  const onlineUserIds = useSelector(selectOnlineUserIds);
  const allMessages = useSelector((state) => state.chat.messagesByUserId);
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Server-truth contact list (`contacts:list`) — refetched on every mount
  // so it can never go stale; live additions arrive via `contacts:added`
  // (see hooks/useSocket.js).
  useEffect(() => {
    if (!currentUser?._id) return;
    fetchContacts(currentUser._id)
      .then((list) => dispatch(setContacts(list || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch, currentUser?._id]);

  // ESC key to clear search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    if (searchQuery) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [searchQuery]);

  // Last message per contact — only populated for chats already opened this
  // session (no "list my conversations" endpoint exists to preload this).
  const lastMessages = useMemo(() => {
    const map = {};
    Object.entries(allMessages).forEach(([otherId, msgs]) => {
      if (msgs.length > 0) map[otherId] = msgs[msgs.length - 1];
    });
    return map;
  }, [allMessages]);

  const contacts = useMemo(() => {
    let list = allContacts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((u) =>
        getDisplayName(u).toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query))
      );
    }

    return [...list].sort((a, b) => {
      const aOnline = onlineUserIds.includes(a._id);
      const bOnline = onlineUserIds.includes(b._id);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      const aMsg = lastMessages[a._id];
      const bMsg = lastMessages[b._id];
      if (aMsg && bMsg) return new Date(bMsg.createdAt) - new Date(aMsg.createdAt);
      if (aMsg) return -1;
      if (bMsg) return 1;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });
  }, [allContacts, searchQuery, onlineUserIds, lastMessages]);

  const handleContactClick = useCallback((user) => {
    navigate(`/chat/${user._id}`);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    disconnectSocket();
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const handleAccountClick = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const initials = getInitials(getDisplayName(currentUser));
  const avatarColor = getAvatarColor(currentUser?._id);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="btn btn-ghost btn-sm fixed top-3 left-3 z-50 md:hidden text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] transition-all duration-200 rounded-xl"
      >
        {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="fixed md:relative z-40 h-full w-80 bg-[var(--c-surface)] flex flex-col border-r border-[var(--c-border)]"
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between bg-[var(--c-surface-2)]">
          <button
            onClick={handleAccountClick}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </div>
              <StatusIndicator userId={currentUser?._id} size="sm" ringColor="var(--c-surface-2)" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h2 className="font-semibold text-sm text-[var(--c-text)] truncate">
                {getDisplayName(currentUser)}
              </h2>
              <p className="text-[11px] text-[var(--c-text-muted)] truncate">{onlineUserIds.length} online</p>
            </div>
          </button>
          <button onClick={handleLogout} className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all" title="Logout">
            <FiLogOut size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative group">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] group-focus-within:text-[var(--c-primary)] transition-colors duration-200" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('sidebar.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--c-input)] border border-transparent rounded-lg pl-9 pr-8 py-2 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none transition-all duration-200 focus:border-[var(--c-primary)]/50 focus:bg-[var(--c-surface-2)] hover:border-[var(--c-border)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Friends / add contacts */}
        <button
          onClick={() => navigate('/friends')}
          className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
            location.pathname === '/friends'
              ? 'bg-[var(--c-primary)]/10 text-[var(--c-primary)]'
              : 'text-[var(--c-text-muted)] hover:bg-[var(--c-hover)]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--c-primary)]/10 flex items-center justify-center flex-shrink-0">
            <FiUserPlus className="text-[var(--c-primary)]" size={18} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h3 className="font-medium text-sm truncate">{t('friends.pageTitle')}</h3>
            <p className="text-[11px] text-[var(--c-text-muted)]">{t('friends.pageSubtitle')}</p>
          </div>
        </button>

        {/* Divider */}
        <div className="border-t border-[var(--c-border)] mx-4 my-1" />

        {/* Section header */}
        <div className="px-4 py-1.5">
          <p className="text-[11px] font-medium text-[var(--c-text-muted)] uppercase tracking-wider">
            Contacts
          </p>
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-md text-[var(--c-primary)]"></span>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 bg-[var(--c-input)] rounded-2xl flex items-center justify-center mb-4">
                <FiMessageSquare className="text-2xl text-[var(--c-text-muted)]" />
              </div>
              <p className="text-sm text-[var(--c-text-muted)]">
                {searchQuery ? 'No results found' : t('sidebar.noContacts')}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {contacts.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <ContactItem
                    user={user}
                    isSelected={urlUserId === user._id}
                    lastMessage={lastMessages[user._id]}
                    unreadCount={user.unreadCount || 0}
                    onClick={() => handleContactClick(user)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.aside>

      {/* Account Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};

export default Sidebar;
