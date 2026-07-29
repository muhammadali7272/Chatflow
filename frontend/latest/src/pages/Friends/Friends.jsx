import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { FiUsers, FiSearch, FiX } from 'react-icons/fi';
import { selectUser } from '../../features/auth/authSlice';
import { selectContacts } from '../../features/users/usersSlice';
import { selectOnlineUserIds } from '../../features/presence/presenceSlice';
import { searchUsers } from '../../services/friendService';
import DiscoveryCard from '../../components/Friends/DiscoveryCard';
import SkeletonCard from '../../components/Friends/SkeletonCard';
import EmptyState from '../../components/Friends/EmptyState';
import { useTranslation } from '../../i18n/I18nContext';

// Discover people to chat with. The sanjarb backend has no "all users"
// event — discovery is search-driven (`users:search` by name/email), and
// people already in the contact list are filtered out client-side. Adding
// someone is mutual server-side and moves them to the sidebar instantly.
const Friends = () => {
  const t = useTranslation();
  const currentUser = useSelector(selectUser);
  const contacts = useSelector(selectContacts);
  const onlineUserIds = useSelector(selectOnlineUserIds);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // An emptied query clears everything synchronously in the change handler
  // (not in the effect — see react-hooks/set-state-in-effect).
  const handleQueryChange = (value) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
    }
  };

  // Debounced server-side search.
  useEffect(() => {
    const q = query.trim();
    if (!q || !currentUser?._id) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setSearching(true);
      searchUsers(currentUser._id, q)
        .then((users) => { if (!cancelled) setResults(users || []); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, currentUser?._id]);

  const people = useMemo(() => {
    const contactIds = new Set(contacts.map((c) => c._id));
    return results.filter((u) => u._id !== currentUser?._id && !contactIds.has(u._id));
  }, [results, contacts, currentUser?._id]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--c-bg)] min-w-0">
      <div className="px-4 py-3 flex items-center gap-3 border-b border-[var(--c-border)] bg-[var(--c-surface-2)]">
        <div className="w-9 h-9 rounded-xl bg-[var(--c-primary)]/10 flex items-center justify-center flex-shrink-0">
          <FiUsers className="text-[var(--c-primary)]" size={18} />
        </div>
        <div>
          <h1 className="font-semibold text-sm text-[var(--c-text)]">{t('friends.pageTitle')}</h1>
          <p className="text-[11px] text-[var(--c-text-muted)]">{t('friends.pageSubtitle')}</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative group">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] group-focus-within:text-[var(--c-primary)] transition-colors duration-200" size={16} />
          <input
            type="text"
            placeholder={t('friends.searchPlaceholder')}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full bg-[var(--c-input)] border border-transparent rounded-lg pl-9 pr-8 py-2 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none transition-all duration-200 focus:border-[var(--c-primary)]/50 focus:bg-[var(--c-surface-2)] hover:border-[var(--c-border)]"
          />
          {query && (
            <button
              onClick={() => handleQueryChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] hover:text-[var(--c-text)]"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-1">
        {searching ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} variant="discovery" />)
        ) : !query.trim() ? (
          <EmptyState icon={FiSearch} title={t('friends.typeToSearch')} />
        ) : people.length === 0 ? (
          <EmptyState icon={FiUsers} title={t('friends.noResults')} />
        ) : (
          <AnimatePresence>
            {people.map((user) => (
              <DiscoveryCard
                key={user._id}
                user={user}
                currentUserId={currentUser?._id}
                isOnline={onlineUserIds.includes(user._id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Friends;
