import { useState, useId } from 'react';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

/**
 * Professional reusable InputField component.
 *
 * Spec:
 * - Height: 48px
 * - Radius: 12px
 * - Padding Left: 48px (for icon)
 * - Padding Right: 48px (for eye icon on password fields)
 * - Icon: left side, absolutely positioned, pointer-events-none
 * - Eye icon: right side for password fields
 * - Placeholder: visible only when input is empty
 * - Text never overlaps icons
 * - Focus: border animation, shadow, transition
 *
 * Props:
 * @param {'blue'|'emerald'} colorScheme - Color theme for active/focus states
 */
const InputField = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: IconComponent,
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
  onBlur,
  disabled = false,
  autoFocus = false,
  min,
  max,
  name,
  colorScheme = 'emerald',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isError = !!error;

  const needsRightPadding = showPasswordToggle || isError;

  // Build icon color class based on state
  const getIconColorClass = () => {
    if (isError) return 'text-[var(--c-danger-text)]';
    if (hasValue) return colorScheme === 'emerald' ? 'text-[var(--c-primary)]' : 'text-[var(--c-primary)]';
    if (focused) return colorScheme === 'emerald' ? 'text-[var(--c-primary)]/70' : 'text-[var(--c-primary)]/70';
    return 'text-[var(--c-text-muted)]';
  };

  // Build border/ring classes based on state
  const getInputClasses = () => {
    const base = `w-full h-12 bg-[var(--c-input)] text-[15px] text-[var(--c-text)] placeholder-[var(--c-placeholder)] outline-none rounded-2xl transition-all duration-200 border-2 ${
      IconComponent ? 'pl-12' : 'pl-4'
    } ${needsRightPadding ? 'pr-12' : 'pr-4'} ${
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    }`;

    if (isError) {
      return `${base} border-[var(--c-danger)]/60 focus:border-[var(--c-danger)] focus:ring-2 focus:ring-[var(--c-danger)]/20`;
    }

    if (colorScheme === 'emerald') {
      if (hasValue) {
        return `${base} border-[var(--c-primary)]/40 focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20`;
      }
      return `${base} border-[var(--c-border)] hover:border-[var(--c-primary)]/30 focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20`;
    }

    // Default blue scheme
    if (hasValue) {
      return `${base} border-[var(--c-primary)]/40 focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20`;
    }
    return `${base} border-[var(--c-border)] hover:border-[var(--c-primary)]/30 focus:border-[var(--c-primary)] focus:ring-2 focus:ring-[var(--c-primary)]/20`;
  };

  return (
    <div className="mb-5">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--c-text-muted)] mb-2"
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Left Icon */}
        {IconComponent && (
          <div
            className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center pointer-events-none z-10"
          >
            <IconComponent
              size={18}
              className={`transition-colors duration-200 ${getIconColorClass()}`}
            />
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoFocus={autoFocus}
          min={min}
          max={max}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
          className={getInputClasses()}
        />

        {/* Right Eye Toggle for Password fields */}
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            tabIndex={-1}
            className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors z-10"
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>

      {/* Error message (animated) */}
      {isError && (
        <p className="text-[var(--c-danger-text)] text-xs mt-1.5 flex items-center gap-1.5 animate-slide-down">
          <FiAlertCircle size={12} className="flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export default InputField;
