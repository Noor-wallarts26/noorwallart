import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILED = 'LOGIN_FAILED';
export const LOGIN_LOCKOUT = 'LOGIN_LOCKOUT';
export const LOGOUT = 'LOGOUT';
export const PIN_FAILED = 'PIN_FAILED';
export const PIN_LOCKOUT = 'PIN_LOCKOUT';
export const SETTINGS_CHANGED = 'SETTINGS_CHANGED';
export const PASSWORD_CHANGED = 'PASSWORD_CHANGED';
export const PIN_VERIFIED = 'PIN_VERIFIED';

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

export function logSecurityEvent(eventType, details = {}) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      ...details
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', 'utf8');
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
