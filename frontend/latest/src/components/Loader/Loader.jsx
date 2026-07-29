const ChatLogo = ({ className = 'w-8 h-8' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const Loader = ({ size = 'md', fullScreen = false, text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
  };

  // Full-screen branded loader — matches the Login page design exactly
  // (same dark-green animated gradient, ChatFlow branding, emerald accent).
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-animated flex flex-col items-center justify-center overflow-hidden animate-fade-in">
        {/* Decorative floating orbs (same as AuthLayout) */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--c-primary)]/15 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--c-primary)]/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '-1.5s' }}
        />

        {/* Brand + spinner */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-xl shadow-[var(--c-primary)]/30 ring-1 ring-[var(--c-border)] mb-5 animate-float text-white">
            <ChatLogo className="w-8 h-8" />
          </div>
          <span className="text-[var(--c-text)] font-extrabold text-xl tracking-tight mb-8">ChatFlow</span>

          <span className="loading loading-spinner loading-lg text-[var(--c-primary)]" />
          {text && <p className="mt-4 text-[var(--c-text-muted)] text-sm">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 animate-fade-in">
      <span className={`loading loading-spinner ${sizeClasses[size]} text-[var(--c-primary)]`} />
      {text && <p className="mt-3 text-[var(--c-text-muted)] text-sm">{text}</p>}
    </div>
  );
};

export default Loader;
