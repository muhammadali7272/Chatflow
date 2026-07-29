/**
 * Format a date to a readable time string
 */
export const formatMessageTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format full date for date separators
 */
export const formatDateSeparator = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  if (diff < oneDay && d.getDate() === now.getDate()) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday';
  }

  if (diff < oneWeek) {
    return d.toLocaleDateString([], { weekday: 'long' });
  }

  return d.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Get initials from a name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Get display name from user object
 */
export const getDisplayName = (user) => {
  if (!user) return 'Unknown';
  if (user.username) return user.username;
  if (user.displayName) return user.displayName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.email) return user.email.split('@')[0];
  return 'Unknown';
};

/**
 * Generate a random avatar color based on user ID
 */
export const getAvatarColor = (userId) => {
  if (!userId) return '#10b981';
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
    '#14B8A6', '#06B6D4', '#84CC16', '#D946EF',
    '#E11D48', '#0EA5E9', '#A855F7', '#22C55E',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 30) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format last seen time
 */
export const formatLastSeen = (date) => {
  if (!date) return 'last seen recently';
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);

  if (diff < 60) return 'last seen just now';
  if (diff < 3600) return `last seen ${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `last seen ${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `last seen ${Math.floor(diff / 86400)}d ago`;
  return `last seen ${d.toLocaleDateString()}`;
};

// Localised, prefix-free relative time ("5 daqiqa oldin" / "5 min ago").
// Used by StatusIndicator, which prepends its own "Last seen" label — no
// date library needed (see CLAUDE.md: keraksiz kutubxona qo'shmaslik).
const RELATIVE_TIME_LABELS = {
  en: { now: 'just now', min: (n) => `${n} min ago`, hour: (n) => `${n}h ago`, day: (n) => `${n}d ago` },
  uz: { now: 'hozirgina', min: (n) => `${n} daqiqa oldin`, hour: (n) => `${n} soat oldin`, day: (n) => `${n} kun oldin` },
  ru: { now: 'только что', min: (n) => `${n} мин назад`, hour: (n) => `${n} ч назад`, day: (n) => `${n} дн назад` },
};

export const formatRelativeTime = (date, lang = 'en') => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  const l = RELATIVE_TIME_LABELS[lang] || RELATIVE_TIME_LABELS.en;

  if (diff < 60) return l.now;
  if (diff < 3600) return l.min(Math.floor(diff / 60));
  if (diff < 86400) return l.hour(Math.floor(diff / 3600));
  if (diff < 604800) return l.day(Math.floor(diff / 86400));
  return d.toLocaleDateString();
};

/**
 * Class name merger
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Build the "selected chat" object for the Saved Messages view — a real
 * conversation with yourself (receiverId === senderId === currentUser),
 * so it reuses all normal direct-message send/history plumbing.
 */
export const buildSavedChatUser = (currentUser) => {
  if (!currentUser) return null;
  return { ...currentUser, isSaved: true };
};

/**
 * Generate a unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * Get recipient ID from message
 */
export const getOtherUserId = (message, currentUserId) => {
  const senderId = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
  const receiverId = typeof message.receiverId === 'object' ? message.receiverId?._id : message.receiverId;
  return senderId === currentUserId ? receiverId : senderId;
};

/**
 * Group messages by date
 */
export const groupMessagesByDate = (messages) => {
  const groups = {};
  messages.forEach((msg) => {
    const date = new Date(msg.createdAt || msg.timestamp);
    const key = date.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  });
  return groups;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
