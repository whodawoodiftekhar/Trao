import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const rawGeminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter((k) => k && k !== 'your_gemini_api_key_here');

/**
 * JWT signing secret. A shared hardcoded fallback lets anyone holding this
 * repo forge tokens, so production refuses to boot without one and development
 * gets a random per-process secret (which invalidates tokens on restart —
 * set JWT_SECRET in .env to keep sessions across restarts).
 */
function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (isProduction) {
    throw new Error(
      'JWT_SECRET is required in production. Set it to a long random string, e.g. `openssl rand -hex 32`.'
    );
  }

  const ephemeral = crypto.randomBytes(32).toString('hex');
  console.warn('[Config] JWT_SECRET not set — using a random secret for this process only. Sessions will not survive a restart.');
  return ephemeral;
}

export const config = {
  isProduction,
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trao',
  geminiApiKey: rawGeminiKeys[0] || '',
  geminiApiKeys: rawGeminiKeys,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  // Opt-in only: crawling private/loopback addresses is an SSRF primitive, so it
  // is never enabled implicitly by NODE_ENV.
  allowLocalUrls: process.env.ALLOW_LOCAL_URLS === 'true',
  jwtSecret: resolveJwtSecret(),
  // Base URL used to build password-reset links. Never derive this from request
  // headers — an attacker controls Origin/Referer and would receive the token.
  appUrl: (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
};
