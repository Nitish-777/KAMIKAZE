/**
 * Configuration Manager
 * Centralized management of environment variables
 * Validates that all required variables are present
 */

// Import security utilities
import { assertServerOnly } from './security.js';

/**
 * Validate environment configuration
 * Throws error if required variables are missing
 */
function validateConfig() {
  assertServerOnly('Config validation');

  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n` +
      `Please copy .env.example to .env.local and fill in the required values.`
    );
  }
}

/**
 * Server-side configuration
 * These are only available and should only be used server-side
 */
export const serverConfig = {
  database: {
    url: process.env.DATABASE_URL,
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
  },
  api: {
    url: process.env.API_URL || 'http://localhost:3000/api',
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    defaultLimit: parseInt(process.env.RATE_LIMIT_DEFAULT_LIMIT || '100'),
    authLimit: parseInt(process.env.RATE_LIMIT_AUTH_LIMIT || '5'),
    registerLimit: parseInt(process.env.RATE_LIMIT_REGISTER_LIMIT || '3'),
  },
  upload: {
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE || '5242880'),
    dir: process.env.UPLOAD_DIR || 'public/uploads',
  },
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800'),
  },
};

/**
 * Get server configuration (server-side only)
 */
export function getServerConfig() {
  assertServerOnly('getServerConfig');
  return serverConfig;
}

/**
 * Validate configuration on startup
 */
try {
  validateConfig();
  console.info('✓ Configuration validated successfully');
} catch (error) {
  console.error('✗ Configuration validation failed:', error.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export default serverConfig;
