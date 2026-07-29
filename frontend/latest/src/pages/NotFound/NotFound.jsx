import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-[var(--c-primary)]/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[var(--c-primary)]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />

      <div className="text-center relative z-10 animate-fade-in-up">
        <div className="text-9xl font-bold bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-hover)] bg-clip-text text-transparent mb-4">
          404
        </div>
        <div className="w-20 h-20 bg-[var(--c-surface-2)]/50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[var(--c-border)]">
          <svg className="w-10 h-10 text-[var(--c-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--c-text)] mb-2">Page Not Found</h1>
        <p className="text-[var(--c-text-muted)] mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--c-primary)] to-[var(--c-primary-hover)] hover:brightness-110 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[var(--c-primary)]/20 hover:shadow-[var(--c-primary)]/40 active:scale-95"
        >
          <FiHome size={18} />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
