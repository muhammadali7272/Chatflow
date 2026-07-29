import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../features/auth/authSlice';

// The backend (prod/src/start.js) issues no token/session and has no
// verify/refresh endpoint — there is nothing to check server-side. "Logged
// in" means only "a `user` object is present in the persisted auth slice".
// PersistGate (see App.jsx) has already rehydrated it synchronously by the
// time this renders, so no loading state is needed.
const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
