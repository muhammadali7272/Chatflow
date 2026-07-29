import { Outlet, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';

const AuthLayout = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gradient-animated flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Decorative floating orbs (emerald / teal) */}
      <div className="absolute top-20 max-sm:top-10 max-sm:left-10 left-20 w-72 h-72 bg-[var(--c-primary)]/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 max-sm:bottom-10 max-sm:right-10 right-20 w-96 h-96 bg-[var(--c-primary)]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-[var(--c-primary)]/5 rounded-full blur-3xl" />

      {/* Logo */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-8 flex items-center gap-2 sm:gap-3 z-20">
        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <span className="text-[var(--c-text)] font-extrabold text-lg sm:text-xl tracking-tight">ChatFlow</span>
      </div>

      {/* Content */}
      <div className="w-full max-w-md relative z-10 animate-fade-in-up px-0 sm:px-2">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
