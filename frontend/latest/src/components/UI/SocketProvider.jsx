import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSocket } from '../../hooks/useSocket';
import { selectIsAuthenticated } from '../../features/auth/authSlice';

/**
 * SocketProvider initializes and manages the socket connection.
 * Renders nothing on its own.
 */
const SocketProvider = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  useSocket();

  useEffect(() => {
    // Socket is initialized in useSocket hook
  }, [isAuthenticated]);

  return null;
};

export default SocketProvider;
