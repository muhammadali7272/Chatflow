import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProtectedRoute from './ProtectedRoute';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import NotFound from '../pages/NotFound/NotFound';
import Loader from '../components/Loader/Loader';
import { selectIsAuthenticated } from '../features/auth/authSlice';

// Lazy-loaded pages (code-split at route boundaries)
const Login = lazy(() => import('../pages/Login/Login'));
const Register = lazy(() => import('../pages/Register/Register'));
const Chat = lazy(() => import('../pages/Chat/Chat'));
const Friends = lazy(() => import('../pages/Friends/Friends'));

// Root path: send logged-in users to the chat, everyone else to login.
const RootRedirect = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return <Navigate to={isAuthenticated ? '/chat' : '/login'} replace />;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader fullScreen text="Loading..." />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:userId" element={<Chat />} />
            <Route path="/friends" element={<Friends />} />
          </Route>
        </Route>

        {/* Redirect root to chat or login based on auth */}
        <Route path="/" element={<RootRedirect />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
