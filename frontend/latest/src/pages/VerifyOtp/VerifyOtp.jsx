import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import { FiHash, FiArrowRight, FiAlertCircle, FiMail } from 'react-icons/fi';
import InputField from '../../components/UI/InputField';

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

const RESEND_COOLDOWN_SECONDS = 30;

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyingOtp, error, verifyOtp, resendOtp, clearError } = useAuth();

  const email = location.state?.email || '';
  const [code, setCode] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setFieldError('');
    clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setFieldError('Enter the 6-digit code');
      return;
    }
    try {
      await verifyOtp(email, code);
    } catch {
      // Error handled by useAuth
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendOtp(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      // Error handled by useAuth
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0 animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[var(--c-primary)]/30 ring-1 ring-[var(--c-border)]">
          <FiMail className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--c-text)] mb-1.5 tracking-tight">Verify your email</h1>
        <p className="text-[var(--c-text-muted)] text-sm">
          We sent a 6-digit code to <span className="text-[var(--c-text)] font-medium">{email}</span>
        </p>
      </div>

      <ErrorAlert message={error || fieldError} />

      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate>
          <InputField
            id="verify-otp-code"
            label="Verification code"
            type="text"
            placeholder="000000"
            value={code}
            onChange={handleChange}
            icon={FiHash}
            error={fieldError}
            colorScheme="emerald"
            autoFocus
          />

          <button
            type="submit"
            disabled={verifyingOtp || code.length !== 6}
            className={`w-full h-12 flex items-center justify-center gap-2.5 text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 ${
              verifyingOtp || code.length !== 6
                ? 'bg-[var(--c-primary)]/40 cursor-not-allowed'
                : 'bg-gradient-brand hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[var(--c-primary)]/30 hover:shadow-xl hover:shadow-[var(--c-primary)]/40'
            }`}
          >
            {verifyingOtp ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                Verify
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-[var(--c-text-muted)]">
          Didn't get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-[var(--c-primary)] hover:text-[var(--c-primary-hover)] font-semibold transition-colors hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </p>

        <p className="text-center mt-2 text-sm text-[var(--c-text-muted)]">
          <Link to="/register" className="hover:text-[var(--c-text)] transition-colors hover:underline">
            Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
