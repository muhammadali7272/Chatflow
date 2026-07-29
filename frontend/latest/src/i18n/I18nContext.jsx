import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, LANGUAGES } from './translations';

const I18nContext = createContext(null);

const readStoredLang = () => {
  try {
    const l = localStorage.getItem('lang');
    if (l && translations[l]) return l;
  } catch { /* ignore */ }
  return 'en';
};

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(readStoredLang);

  const setLang = useCallback((next) => {
    if (!translations[next]) return;
    setLangState(next);
    try { localStorage.setItem('lang', next); } catch { /* ignore */ }
    document.documentElement.setAttribute('lang', next);
  }, []);

  // Keep <html lang> in sync
  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // t(key): current language → English fallback → key
  const t = useCallback(
    (key) => translations[lang]?.[key] ?? translations.en?.[key] ?? key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

// Convenience hook returning just the translate function
export const useTranslation = () => useI18n().t;
