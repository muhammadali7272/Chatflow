import { useState, useRef, useCallback, useEffect } from 'react';
import { FiSend, FiSmile, FiPaperclip } from 'react-icons/fi';

const MessageInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [message]);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage?.(trimmedMessage);
    setMessage('');
    textareaRef.current?.focus();
  }, [message, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="bg-[var(--c-surface-2)] border-t border-[var(--c-border)]">
      {/* Input area */}
      <div className="flex items-end gap-2 px-3 py-2">
        {/* Attach button */}
        <button className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all flex-shrink-0" title="Attach">
          <FiPaperclip size={20} />
        </button>

        {/* Emoji button */}
        <button className="p-2 text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-hover)] rounded-lg transition-all flex-shrink-0" title="Emoji">
          <FiSmile size={20} />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            className="w-full bg-[var(--c-input)] border border-transparent rounded-lg pl-3 pr-3 py-2.5 text-sm text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none resize-none transition-all duration-200 focus:border-[var(--c-primary)]/50 hover:border-[var(--c-border)] max-h-[150px]"
            style={{ minHeight: '40px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2.5 bg-[var(--c-primary)] hover:bg-[var(--c-primary-hover)] text-white rounded-full transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0 shadow-lg shadow-[var(--c-primary)]/20 disabled:opacity-40 disabled:hover:scale-100"
          title="Send"
        >
          <FiSend size={16} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
