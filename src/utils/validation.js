/**
 * Centralized Validation & Sanitization Utility
 */

/**
 * Strips common HTML tags and potential injection payloads from freeform text.
 * @param {string} input - The raw user input
 * @returns {string} Sanitized input safe for Firestore mapping
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Basic stripping of <tag> and </tag>
  const stripped = input.replace(/<\/?[^>]+(>|$)/g, "");
  return stripped.trim();
};

/**
 * Evaluates password entropy based on topographical strength rules.
 * @param {string} password - Raw password
 * @returns {{ score: number, label: string, messageKey: string, isValid: boolean }}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { score: 0, label: 'weak', messageKey: 'auth.pwdWeak', isValid: false };
  }

  const lengthValid = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]+/.test(password);

  let score = 0;
  if (lengthValid) score += 1;
  if (hasUpperCase || hasLowerCase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecial) score += 1;

  // Topological requirement: MUST have UC, NUM, SPECIAL, and length >= 8
  const isValid = lengthValid && hasUpperCase && hasNumbers && hasSpecial;

  let label = 'weak';
  let messageKey = 'auth.pwdWeak';

  if (score < 3) {
    label = 'weak';
    messageKey = 'auth.pwdWeak';
  } else if (score === 3) {
    label = 'medium';
    messageKey = 'auth.pwdMedium';
  } else if (score === 4) {
    label = 'strong';
    messageKey = 'auth.pwdStrong';
  }

  return { score, label, messageKey, isValid };
};
