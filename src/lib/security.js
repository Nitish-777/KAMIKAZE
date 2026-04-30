/**
 * Security Utility Functions
 * Ensures sensitive data is never exposed to client-side
 */

/**
 * Verify that a value is only used server-side
 * Throws error if accessed from client-side
 */
export function assertServerOnly(context = 'API Route') {
  if (typeof window !== 'undefined') {
    throw new Error(`This function should only be called server-side, not from client. Context: ${context}`);
  }
}

/**
 * Get environment variable with validation
 * Ensures sensitive variables are only accessed server-side
 */
export function getServerEnv(key, defaultValue = null) {
  assertServerOnly(`Environment: ${key}`);
  
  const value = process.env[key] || defaultValue;
  
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

/**
 * Safe object for client-side use
 * Explicitly define what can be exposed
 */
export const clientSafeEnv = {
  // Only expose non-sensitive configuration
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
  imageOptimization: {
    sizes: (process.env.NEXT_PUBLIC_IMAGE_SIZES || '16,32,48,64,96,128,256').split(',').map(Number),
    deviceSizes: (process.env.NEXT_PUBLIC_DEVICE_SIZES || '640,750,828,1080,1200').split(',').map(Number),
  },
  // Add other safe configs here
};

/**
 * Validate that no sensitive keys are exposed to client
 */
export function validateNoClientSideSecrets(obj) {
  const sensitiveKeys = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'PRIVATE', 'APIKEY'];
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const upperKey = key.toUpperCase();
      if (sensitiveKeys.some(sensitive => upperKey.includes(sensitive))) {
        console.warn(`Warning: Potential sensitive key exposed to client: ${key}`);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Sanitize error messages for client-side
 * Never expose internal errors or sensitive paths
 */
export function sanitizeError(error, isDevelopment = false) {
  if (isDevelopment) {
    // In development, you might want to show more details
    return error.message;
  }
  
  // In production, only show generic message
  const message = error.message || 'An error occurred';
  
  if (message.includes('ENOENT') || message.includes('EACCES')) {
    return 'File operation failed';
  }
  
  if (message.includes('ECONNREFUSED')) {
    return 'Database connection failed';
  }
  
  // Remove any file paths
  return message.replace(/\/[a-zA-Z0-9_\-./]+/g, '[path]').replace(/\\[a-zA-Z0-9_\-:\\\\]+/g, '[path]');
}

/**
 * Hash a secret for comparison (don't store in plaintext)
 */
export async function hashSecret(secret) {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Check if a value is safe for logging
 */
export function isSafeToLog(value) {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /authorization/i,
  ];
  
  return !sensitivePatterns.some(pattern => pattern.test(value.toString()));
}

/**
 * Secure API response wrapper
 * Ensures sensitive data is never included
 */
export function secureResponse(data, allowedKeys = []) {
  const sanitized = {};
  
  for (const key of allowedKeys) {
    if (data.hasOwnProperty(key)) {
      sanitized[key] = data[key];
    }
  }
  
  return sanitized;
}
