import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser, setError, clearError, logout as logoutAction, selectUser, selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../features/auth/authSlice';
import { loginUser, registerUser } from '../services/authService';
import { disconnectSocket } from '../services/socket';
import { emitUserOnline } from '../services/chatService';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const globalLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [loggingIn, setLoggingIn] = useState(false);
  const [registering, setRegistering] = useState(false);

  /**
   * Login with email and password. Backend issues no token — a successful
   * response is just `{success, user}`.
   */
  const login = useCallback(async (email, password) => {
    setLoggingIn(true);
    dispatch(clearError());

    try {
      const result = await loginUser({ email, password });

      if (result.success && result.user) {
        dispatch(setUser(result.user));
        emitUserOnline(result.user._id);
        toast.success(`Welcome back, ${result.user.firstName || 'User'}!`);
        navigate('/chat');
        return result.user;
      }

      return null;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid email or password';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoggingIn(false);
    }
  }, [dispatch, navigate]);

  /**
   * Register a new user — email + password, no OTP step. Logs in
   * immediately on success (backend already returns the full user).
   */
  const register = useCallback(async (userData) => {
    setRegistering(true);
    dispatch(clearError());

    try {
      const result = await registerUser(userData);

      if (result.success && result.user) {
        dispatch(setUser(result.user));
        emitUserOnline(result.user._id);
        toast.success(`Welcome, ${result.user.firstName || 'User'}!`);
        navigate('/chat');
        return result.user;
      }

      return null;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      throw err;
    } finally {
      setRegistering(false);
    }
  }, [dispatch, navigate]);

  /**
   * Logout — purely local, there is no server-side session to revoke.
   */
  const logout = useCallback(() => {
    disconnectSocket();
    dispatch(logoutAction());
    toast.success('Logged out successfully');
    navigate('/login');
  }, [dispatch, navigate]);

  return {
    user,
    isAuthenticated,
    loggingIn,
    registering,
    loading: loggingIn || registering || globalLoading,
    error,
    login,
    register,
    logout,
    clearError: () => dispatch(clearError()),
  };
};
