import { memo } from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = memo(({ userName = 'Someone' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 px-4 py-1"
    >
      <div className="bg-[var(--c-bubble-in)] rounded-lg rounded-bl-sm px-3 py-2.5 flex items-center gap-1">
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-[var(--c-text-muted)] inline-block"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0.15 }}
          className="w-1.5 h-1.5 rounded-full bg-[var(--c-text-muted)] inline-block"
        />
        <motion.span
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut', delay: 0.3 }}
          className="w-1.5 h-1.5 rounded-full bg-[var(--c-text-muted)] inline-block"
        />
      </div>
      <span className="text-xs text-[var(--c-text-muted)] italic">{userName} is typing...</span>
    </motion.div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

export default TypingIndicator;
