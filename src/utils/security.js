/**
 * Security Utilities - Noor Wallarts & Gifts
 * XSS, injection, and input sanitization helpers
 */

/**
 * Strip all HTML tags from a string to prevent XSS
 */
export const sanitizeText = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Clean text for safe storage (no HTML, no script injection)
 * Use before writing any user input to Firestore
 */
export const cleanInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove script tags and event handlers
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Validate phone number (10 digits India)
 */
export const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(String(phone).replace(/\s/g, ''));
};

/**
 * Validate PIN (6 digits)
 */
export const isValidPin = (pin) => {
  return /^\d{6}$/.test(String(pin));
};

/**
 * Validate price (positive number, up to 2 decimals)
 */
export const isValidPrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0 && /^\d+(\.\d{0,2})?$/.test(String(price));
};

/**
 * Sanitize an entire form data object by cleaning all string fields
 */
export const sanitizeFormData = (formData) => {
  const result = {};
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      result[key] = cleanInput(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

/**
 * Rate limiting - track action timestamps to prevent spam
 */
const rateLimitMap = new Map();
export const isRateLimited = (actionKey, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const attempts = rateLimitMap.get(actionKey) || [];
  const recent = attempts.filter(t => now - t < windowMs);
  if (recent.length >= maxAttempts) return true;
  rateLimitMap.set(actionKey, [...recent, now]);
  return false;
};

/**
 * Content Security: Validate image URL (only allow http/https, not data URIs)
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

/**
 * Coupon code validation (uppercase alphanumeric, 3–20 chars)
 */
export const isValidCouponCode = (code) => {
  return /^[A-Z0-9_-]{3,20}$/.test(String(code));
};
