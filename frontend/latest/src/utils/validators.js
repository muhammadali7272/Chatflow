export const VALIDATION = {
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  AGE_MIN: 12,
  AGE_MAX: 120,
};

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }
  if (!VALIDATION.EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true, error: null };
};

/**
 * Validate password
 */
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` };
  }
  return { valid: true, error: null };
};

/**
 * Validate name (first name or last name)
 */
export const validateName = (name, fieldName = 'Name') => {
  if (!name || !name.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  if (name.trim().length < VALIDATION.NAME_MIN_LENGTH) {
    return { valid: false, error: `${fieldName} must be at least ${VALIDATION.NAME_MIN_LENGTH} characters` };
  }
  if (name.trim().length > VALIDATION.NAME_MAX_LENGTH) {
    return { valid: false, error: `${fieldName} must be at most ${VALIDATION.NAME_MAX_LENGTH} characters` };
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return { valid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
  }
  return { valid: true, error: null };
};

/**
 * Validate age
 */
export const validateAge = (age) => {
  const ageNum = parseInt(age, 10);
  if (!age || isNaN(ageNum)) {
    return { valid: false, error: 'Age is required' };
  }
  if (ageNum < VALIDATION.AGE_MIN || ageNum > VALIDATION.AGE_MAX) {
    return { valid: false, error: `Age must be between ${VALIDATION.AGE_MIN} and ${VALIDATION.AGE_MAX}` };
  }
  return { valid: true, error: null };
};
