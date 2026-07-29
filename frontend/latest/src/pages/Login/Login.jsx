import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validators';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import InputField from '../../components/UI/InputField';
import { useTranslation } from '../../i18n/I18nContext';

const ErrorAlert = ({ message }) => {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 p-4 bg-[var(--c-danger)]/10 border border-[var(--c-danger)]/20 rounded-xl flex items-start gap-3"
    >
      <FiAlertCircle className="text-[var(--c-danger-text)] mt-0.5 flex-shrink-0" size={18} />
      <p className="text-[var(--c-danger-text)] text-sm leading-relaxed">{message}</p>
    </motion.div>
  );
};

const Login = () => {
  const { loggingIn, error, login, clearError } = useAuth();
  const t = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // On login we only require the password to be present (length/complexity is
  // enforced at registration). This lets short/legacy passwords sign in.
  const validateLoginPassword = (password) =>
    password ? { valid: true, error: null } : { valid: false, error: 'Password is required' };
  const validators = { email: validateEmail, password: validateLoginPassword };

  // Realtime validation for a single field
  const validateField = useCallback((field, value) => {
    const result = validators[field](value);
    setFieldErrors((prev) => ({ ...prev, [field]: result.valid ? '' : result.error }));
    return result.valid;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const emailOk = validateField('email', email);
    const passwordOk = validateField('password', password);
    setTouched({ email: true, password: true });

    if (!emailOk || !passwordOk) return;

    try {
      await login(email, password);
    } catch {
      // Error handled by useAuth
    }
  };

  // Live-validate as the user types (only after the field has been touched)
  const handleChange = useCallback((field, setter) => (e) => {
    const value = e.target.value;
    setter(value);
    clearError();
    if (touched[field]) validateField(field, value);
  }, [clearError, touched, validateField]);

  const handleBlur = useCallback((field, value) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, value);
  }, [validateField]);

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[var(--c-primary)]/30 ring-1 ring-[var(--c-border)]">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--c-text)] mb-1.5 tracking-tight">{t('auth.welcomeBack')}</h1>
        <p className="text-[var(--c-text-muted)] text-sm">{t('auth.signInSubtitle')}</p>
      </div>

      <ErrorAlert message={error} />

      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <InputField
            id="login-email"
            label={t('auth.emailLabel')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={handleChange('email', setEmail)}
            onBlur={handleBlur('email', email)}
            icon={FiMail}
            error={fieldErrors.email}
            colorScheme="emerald"
            autoFocus
          />

          {/* Password */}
          <InputField
            id="login-password"
            label={t('auth.passwordLabel')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChange={handleChange('password', setPassword)}
            onBlur={handleBlur('password', password)}
            icon={FiLock}
            error={fieldErrors.password}
            colorScheme="emerald"
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loggingIn || !email.trim() || !password}
            className={`w-full h-12 flex items-center justify-center gap-2.5 text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 ${
              loggingIn || !email.trim() || !password
                ? 'bg-[var(--c-primary)]/40 cursor-not-allowed'
                : 'bg-gradient-brand hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[var(--c-primary)]/30 hover:shadow-xl hover:shadow-[var(--c-primary)]/40'
            }`}
          >
            {loggingIn ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                {t('auth.signIn')}
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-sm text-[var(--c-text-muted)]">
          {t('auth.noAccount')}{' '}
          <Link
            to="/register"
            className="text-[var(--c-primary)] hover:text-[var(--c-primary-hover)] font-semibold transition-colors hover:underline"
          >
            {t('auth.createOne')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
