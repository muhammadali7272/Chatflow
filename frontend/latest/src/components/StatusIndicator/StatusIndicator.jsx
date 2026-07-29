import { memo } from 'react';
import { useSelector } from 'react-redux';
import { selectIsUserOnline, selectLastSeen } from '../../features/presence/presenceSlice';
import { formatRelativeTime } from '../../utils/helpers';
import { useI18n } from '../../i18n/I18nContext';

// Single, reusable presence indicator used everywhere (chat list, chat header,
// profile panel, friends list) — never re-implement the dot/label by hand.
// Reads its state straight from the presence slice by user id, so it stays in
// sync app-wide with one <StatusIndicator user={user} /> call.
//
//   variant="dot"  → small coloured dot, absolutely positioned in the corner of
//                    an avatar. The avatar wrapper must be `position: relative`.
//   variant="text" → coloured dot + "Online" / "Oxirgi faollik: 5 daqiqa oldin".
//
// green = online, gray = offline; the dot is ringed with the surface colour so
// it separates cleanly from the avatar.

// Corner-dot diameters (overlay on an avatar).
const OVERLAY_DOT = { sm: 'w-3 h-3', md: 'w-3.5 h-3.5', lg: 'w-4 h-4' };
// Inline-dot diameters (next to the status label).
const INLINE_DOT = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };

const StatusIndicator = memo(({
  user,
  userId: userIdProp,
  size = 'sm',
  variant = 'dot',
  ringColor = 'var(--c-surface)',
  className = '',
}) => {
  const userId = userIdProp || user?._id || user?.id || null;
  const isOnline = useSelector(selectIsUserOnline(userId));
  const lastSeenFromStore = useSelector(selectLastSeen(userId));
  const { t, lang } = useI18n();

  const dotColor = isOnline ? 'bg-green-500' : 'bg-gray-400';

  if (variant === 'dot') {
    return (
      <span
        aria-label={isOnline ? t('status.online') : t('status.offline')}
        className={`absolute bottom-0 right-0 rounded-full ${OVERLAY_DOT[size] || OVERLAY_DOT.sm} ${dotColor} ${className}`}
        style={{ border: `2px solid ${ringColor}` }}
      />
    );
  }

  const lastSeen = lastSeenFromStore || user?.lastSeen || null;
  const label = isOnline
    ? t('status.online')
    : lastSeen
      ? `${t('status.lastSeen')} ${formatRelativeTime(lastSeen, lang)}`
      : t('status.offline');

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={`rounded-full flex-shrink-0 ${INLINE_DOT[size] || INLINE_DOT.sm} ${dotColor}`} />
      <span className={`truncate ${isOnline ? 'text-[var(--c-primary)]' : 'text-[var(--c-text-muted)]'}`}>
        {label}
      </span>
    </span>
  );
});

StatusIndicator.displayName = 'StatusIndicator';

export default StatusIndicator;
