import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

import { 
  logSecurityEvent, 
  LOGIN_SUCCESS, 
  LOGIN_FAILED, 
  LOGIN_LOCKOUT, 
  LOGOUT, 
  PIN_FAILED, 
  PIN_LOCKOUT, 
  PIN_VERIFIED 
} from './middleware/auditLogger.js';
import { requireAdmin, getClientIp } from './middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 10000;
const DIST_DIR = path.join(__dirname, 'dist');

const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: [
          "'self'",
          "https://*.firebaseio.com",
          "https://*.googleapis.com",
          "https://api.razorpay.com",
          "wss://*.firebaseio.com",
          "https://firestore.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://www.googleapis.com"
        ],
        frameSrc: ["https://checkout.razorpay.com", "https://*.firebaseapp.com"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
  name: '__nk_sid',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'strict', 
    maxAge: 4 * 60 * 60 * 1000 
  }
}));

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/', globalLimiter);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin-ops', adminRoutes);

const loginAttempts = new Map();
const pinAttempts = new Map();

app.get('/health', (req, res) => res.status(200).send('OK'));
app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.post('/api/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ error: 'User ID or Password is incorrect.' });
    }
    
    const clientIp = getClientIp(req);
    const lockoutInfo = loginAttempts.get(email);
    
    if (lockoutInfo && lockoutInfo.lockedUntil > Date.now()) {
      return res.status(429).json({ error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' });
    }
    
    if (email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
      const attempts = (loginAttempts.get(email)?.count || 0) + 1;
      loginAttempts.set(email, { count: attempts, lockedUntil: 0 });
      logSecurityEvent(LOGIN_FAILED, { ip: clientIp, userIdentifier: email });
      return res.status(401).json({ error: 'User ID or Password is incorrect.' });
    }
    
    const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');
    if (!match) {
      const attempts = (loginAttempts.get(email)?.count || 0) + 1;
      if (attempts >= 3) {
        loginAttempts.set(email, { count: attempts, lockedUntil: Date.now() + 15 * 60 * 1000 });
        logSecurityEvent(LOGIN_LOCKOUT, { ip: clientIp, userIdentifier: email });
      } else {
        loginAttempts.set(email, { count: attempts, lockedUntil: 0 });
      }
      logSecurityEvent(LOGIN_FAILED, { ip: clientIp, userIdentifier: email });
      return res.status(401).json({ error: 'User ID or Password is incorrect.' });
    }
    
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error.' });
      }
      req.session.isAdmin = true;
      req.session.adminEmail = email;
      req.session.loginTime = Date.now();
      
      loginAttempts.delete(email);
      logSecurityEvent(LOGIN_SUCCESS, { ip: clientIp, userIdentifier: email });
      
      return res.status(200).json({ success: true });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  const email = req.session?.adminEmail;
  const clientIp = getClientIp(req);
  
  if (email) {
    logSecurityEvent(LOGOUT, { ip: clientIp, userIdentifier: email });
  }
  
  req.session.destroy((err) => {
    res.clearCookie('__nk_sid');
    return res.status(200).json({ success: true });
  });
});

app.get('/api/admin/session', (req, res) => {
  if (req.session && req.session.isAdmin === true) {
    return res.status(200).json({ authenticated: true, email: req.session.adminEmail });
  } else {
    return res.status(401).json({ authenticated: false });
  }
});

app.post('/api/admin/verify-pin', requireAdmin, authLimiter, async (req, res) => {
  try {
    const { pin } = req.body;
    
    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ error: 'Invalid PIN format.' });
    }
    
    const clientIp = getClientIp(req);
    const lockoutKey = req.session.adminEmail || clientIp;
    const lockoutInfo = pinAttempts.get(lockoutKey);
    
    if (lockoutInfo && lockoutInfo.lockedUntil > Date.now()) {
      return res.status(429).json({ error: 'Payment Settings access is temporarily locked. Please try again later.' });
    }
    
    const match = await bcrypt.compare(pin, process.env.PAYMENT_PIN_HASH || '');
    if (!match) {
      const attempts = (pinAttempts.get(lockoutKey)?.count || 0) + 1;
      if (attempts >= 3) {
        pinAttempts.set(lockoutKey, { count: attempts, lockedUntil: Date.now() + 4 * 60 * 60 * 1000 });
        logSecurityEvent(PIN_LOCKOUT, { ip: clientIp, userIdentifier: lockoutKey });
      } else {
        pinAttempts.set(lockoutKey, { count: attempts, lockedUntil: 0 });
      }
      logSecurityEvent(PIN_FAILED, { ip: clientIp, userIdentifier: lockoutKey });
      return res.status(401).json({ error: 'Incorrect PIN.' });
    }
    
    pinAttempts.delete(lockoutKey);
    req.session.pinVerified = true;
    req.session.pinVerifiedAt = Date.now();
    logSecurityEvent(PIN_VERIFIED, { ip: clientIp, userIdentifier: lockoutKey });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/admin/pin-status', requireAdmin, (req, res) => {
  const lockoutKey = req.session.adminEmail || getClientIp(req);
  const lockoutInfo = pinAttempts.get(lockoutKey);
  const locked = lockoutInfo ? lockoutInfo.lockedUntil > Date.now() : false;
  
  return res.status(200).json({
    verified: req.session.pinVerified === true,
    locked
  });
});

app.get('/api/admin/info', requireAdmin, (req, res) => {
  return res.status(200).json({ message: 'Admin session active', email: req.session.adminEmail });
});

app.use(express.static(DIST_DIR, { maxAge: '1d', etag: true }));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
