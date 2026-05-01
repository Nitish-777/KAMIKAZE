/**
 * Configuration Manager
 * Centralized management of environment variables.
 * Validation is lazy — only runs when getServerConfig() is first called.
 */

import { assertServerOnly } from './security.js';

let validated = false;

function validateConfig() {
  if (validated) return;
  assertServerOnly('Config validation');

  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const msg = `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\nPlease copy .env.example to .env and fill in the required values.`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      console.warn('⚠ ' + msg);
    }
  }

  validated = true;
}

export const serverConfig = {
  database: { url: process.env.DATABASE_URL },
  auth: { secret: process.env.NEXTAUTH_SECRET, url: process.env.NEXTAUTH_URL },
  api: { url: process.env.API_URL || 'http://localhost:3000/api' },
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

export function getServerConfig() {
  validateConfig();
  return serverConfig;
}

export default serverConfig;
