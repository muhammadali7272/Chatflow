import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, validateName, validateAge } from '../../utils/validators';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiArrowRight, FiCalendar, FiAlertCircle } from 'react-icons/fi';
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

const Register = () => {
  const { registering, error, register, clearError } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validate one field (reads latest form data for cross-field checks like confirm)
  const validateField = useCallback((field, value, data) => {
    let result = { valid: true, error: null };
    switch (field) {
      case 'firstName': result = validateName(value, 'First Name'); break;
      case 'lastName': result = validateName(value, 'Last Name'); break;
      case 'age': result = validateAge(value); break;
      case 'email': result = validateEmail(value); break;
      case 'password': result = validatePassword(value); break;
      case 'confirmPassword':
        if (!value) result = { valid: false, error: 'Please confirm your password' };
        else if (value !== data.password) result = { valid: false, error: 'Passwords do not match' };
        break;
      default: break;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: result.valid ? '' : result.error }));
    return result.valid;
  }, []);

  const handleChange = useCallback((field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (touched[field]) validateField(field, value, next);
      // Keep confirm-password error in sync when password changes
      if (field === 'password' && touched.confirmPassword) {
        validateField('confirmPassword', next.confirmPassword, next);
      }
      return next;
    });
    clearError();
  }, [clearError, touched, validateField]);

  const handleBlur = useCallback((field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setFormData((prev) => { validateField(field, prev[field], prev); return prev; });
  }, [validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const fields = ['firstName', 'lastName', 'age', 'email', 'password', 'confirmPassword'];
    const allValid = fields.map((f) => validateField(f, formData[f], formData)).every(Boolean);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));

    if (!allValid) return;

    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        age: parseInt(formData.age, 10),
        email: formData.email.trim(),
        password: formData.password,
      });
    } catch {
      // Error handled by useAuth
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const pw = formData.password;
    if (!pw) return { level: 0, text: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 2) return { level: 1, text: 'Weak', color: 'bg-[var(--c-danger)]' };
    if (score <= 4) return { level: 2, text: 'Medium', color: 'bg-yellow-500' };
    return { level: 3, text: 'Strong', color: 'bg-[var(--c-primary)]' };
  };

  const pwStrength = getPasswordStrength();

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-0 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[var(--c-primary)]/30 ring-1 ring-[var(--c-border)]">
          <FiUser className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--c-text)] mb-1.5 tracking-tight">Create Account</h1>
        <p className="text-[var(--c-text-muted)] text-sm">Join ChatFlow and start chatting</p>
      </div>

      <ErrorAlert message={error} />

      <div className="glass-card rounded-3xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} noValidate>
          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-3">
            <InputField
              id="reg-firstname"
              label="First Name"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange('firstName')}
              onBlur={handleBlur('firstName')}
              icon={FiUser}
              error={fieldErrors.firstName}
              colorScheme="emerald"
              autoFocus
            />
            <InputField
              id="reg-lastname"
              label="Last Name"
              type="text"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange('lastName')}
              onBlur={handleBlur('lastName')}
              icon={FiUser}
              error={fieldErrors.lastName}
              colorScheme="emerald"
            />
          </div>

          {/* Age */}
          <InputField
            id="reg-age"
            label="Age"
            type="number"
            placeholder="Enter your age"
            value={formData.age}
            onChange={handleChange('age')}
            onBlur={handleBlur('age')}
            icon={FiCalendar}
            error={fieldErrors.age}
            colorScheme="emerald"
            min={12}
            max={120}
          />

          {/* Email */}
          <InputField
            id="reg-email"
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            icon={FiMail}
            error={fieldErrors.email}
            colorScheme="emerald"
          />

          {/* Password */}
          <InputField
            id="reg-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            icon={FiLock}
            error={fieldErrors.password}
            colorScheme="emerald"
            showPasswordToggle
            showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
          />

          {/* Password strength indicator */}
          {formData.password && !fieldErrors.password && (
            <div className="flex items-center gap-2 -mt-3 mb-5">
              <div className="flex-1 h-1.5 bg-[var(--c-neutral)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pwStrength.color}`}
                  style={{
                    width: pwStrength.level === 1 ? '33%' : pwStrength.level === 2 ? '66%' : '100%',
                  }}
                />
              </div>
              <span className={`text-[11px] font-medium ${
                pwStrength.level === 1 ? 'text-[var(--c-danger-text)]' : pwStrength.level === 2 ? 'text-yellow-400' : 'text-[var(--c-primary)]'
              }`}>
                {pwStrength.text}
              </span>
            </div>
          )}

          {/* Confirm Password */}
          <InputField
            id="reg-confirm-password"
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            icon={FiLock}
            error={fieldErrors.confirmPassword}
            colorScheme="emerald"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={registering}
            className={`w-full h-12 flex items-center justify-center gap-2.5 text-white font-semibold text-[15px] rounded-2xl transition-all duration-200 mt-2 ${
              registering
                ? 'bg-[var(--c-primary)]/40 cursor-not-allowed'
                : 'bg-gradient-brand hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[var(--c-primary)]/30 hover:shadow-xl hover:shadow-[var(--c-primary)]/40'
            }`}
          >
            {registering ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                Create Account
                <FiArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center mt-6 text-sm text-[var(--c-text-muted)]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[var(--c-primary)] hover:text-[var(--c-primary-hover)] font-semibold transition-colors hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
