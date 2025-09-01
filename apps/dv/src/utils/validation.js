/**
 * Frontend validation utilities for the loyalty system
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validatePhone = (phone) => {
  // Remove spaces, dashes, and parentheses for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Basic validation for international numbers
  // Should start with + or digit, followed by 7-15 digits
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and messages
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }
  
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }
  
  // Optional: Add more sophisticated password rules
  // if (!/[A-Z]/.test(password)) {
  //   errors.push("Password must contain at least one uppercase letter");
  // }
  
  // if (!/[a-z]/.test(password)) {
  //   errors.push("Password must contain at least one lowercase letter");
  // }
  
  // if (!/\d/.test(password)) {
  //   errors.push("Password must contain at least one number");
  // }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate required fields
 * @param {object} fields - Object with field names and values
 * @returns {object} - Validation result with isValid and missing fields
 */
export const validateRequiredFields = (fields) => {
  const missing = [];
  
  Object.entries(fields).forEach(([fieldName, value]) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missing.push(fieldName);
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

/**
 * Validate signup form data
 * @param {object} formData - Signup form data
 * @returns {object} - Validation result with isValid and errors
 */
export const validateSignupForm = (formData) => {
  const { email, password, firstName, lastName, phone } = formData;
  const errors = [];
  
  // Check required fields
  const requiredCheck = validateRequiredFields({
    email,
    password,
    firstName,
    lastName,
    phone
  });
  
  if (!requiredCheck.isValid) {
    errors.push(`Required fields missing: ${requiredCheck.missing.join(', ')}`);
  }
  
  // Validate email format
  if (email && !validateEmail(email)) {
    errors.push("Invalid email format");
  }
  
  // Validate phone format
  if (phone && !validatePhone(phone)) {
    errors.push("Invalid phone number format. Please include country code (e.g., +44 123 456 7890)");
  }
  
  // Validate password
  if (password) {
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      errors.push(...passwordCheck.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string} - Formatted phone number
 */
export const formatPhoneNumber = (phone) => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Basic formatting for common patterns
  if (digits.length === 11 && digits.startsWith('1')) {
    // US format: +1 (XXX) XXX-XXXX
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    // Local US format: (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // For international numbers, just add + if not present
  return phone.startsWith('+') ? phone : '+' + phone;
};

/**
 * Real-time validation for form fields
 * @param {string} fieldName - Name of the field being validated
 * @param {string} value - Value to validate
 * @returns {object} - Validation result with isValid and message
 */
export const validateField = (fieldName, value) => {
  switch (fieldName) {
    case 'email':
      return {
        isValid: validateEmail(value),
        message: validateEmail(value) ? '' : 'Invalid email format'
      };
      
    case 'phone':
      return {
        isValid: validatePhone(value),
        message: validatePhone(value) ? '' : 'Invalid phone number format'
      };
      
    case 'password':
      const passwordCheck = validatePassword(value);
      return {
        isValid: passwordCheck.isValid,
        message: passwordCheck.errors.join(', ')
      };
      
    case 'firstName':
    case 'lastName':
      return {
        isValid: value && value.trim().length > 0,
        message: value && value.trim().length > 0 ? '' : 'This field is required'
      };
      
    default:
      return {
        isValid: true,
        message: ''
      };
  }
};
