import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../features/auth/authSlice';

/**
 * Keeps the document theme in sync with the logged-in user preference (falling
 * back to localStorage, then dark). Renders nothing. The initial theme is
 * applied by the inline boot script in index.html to avoid a flash.
 */
const applyTheme = (theme) => {
  const t = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('theme', t); } catch { /* ignore */ }
};

const ThemeProvider = () => {
  const user = useSelector(selectUser);

  useEffect(() => {
    const stored = (() => { try { return localStorage.getItem('theme'); } catch { return null; } })();
    applyTheme(user?.theme || stored || 'dark');
  }, [user?.theme]);

  return null;
};

export { applyTheme };
export default ThemeProvider;
