import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { User } from '../models/userModel';
import { config } from '../Config/env';
import { sendPasswordResetOtp } from '../helpers/email/email-service';

export const userRoutes = Router();

const MIN_PASSWORD_LENGTH = 6;
const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const OTP_TTL_MS = OTP_TTL_MINUTES * 60 * 1000;
/** Wrong guesses allowed before the code is burned and a new one is required. */
const OTP_MAX_ATTEMPTS = 5;

export interface AuthedUser {
  id: string;
  email: string;
  name: string;
  targetRole?: string;
  seniority?: string;
}

/** Throttles credential guessing and reset-email spam. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.', code: 'RATE_LIMITED' }
});

/**
 * /forgot-password answers whether an email is registered, which is exactly the
 * signal an attacker wants. It gets a much tighter budget than the other auth
 * routes so the form cannot be scripted into an account-discovery oracle.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again in a few minutes.', code: 'RATE_LIMITED' }
});

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    (req as any).user = jwt.verify(token, config.jwtSecret) as AuthedUser;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired session token' });
  }
}

/** The authenticated caller's id. Safe to call only behind `authenticate`. */
export function currentUserId(req: Request): string {
  return (req as any).user.id;
}

function signToken(user: any): string {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      targetRole: user.targetRole,
      seniority: user.seniority
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

function publicUser(user: any) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    targetRole: user.targetRole || '',
    seniority: user.seniority || ''
  };
}

/** Cryptographically random 6-digit code — Math.random is predictable. */
function generateOtp(): string {
  const max = 10 ** OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, '0');
}

// Deliberately not a template-literal RegExp: `\d` inside backticks collapses
// to a literal "d", which silently turns the check into /^d{6}$/.
const isOtpShaped = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length === OTP_LENGTH && /^\d+$/.test(trimmed);
};

type OtpFailure = { status: number; message: string };

/**
 * Shared gate for verify-otp and reset-password. Both must re-check the code,
 * so the counting and expiry rules live in exactly one place.
 */
async function loadUserByValidOtp(
  email: unknown,
  otp: unknown
): Promise<{ user: any } | { error: OtpFailure }> {
  const expired: OtpFailure = { status: 400, message: 'This code has expired. Please request a new one.' };
  const wrong: OtpFailure = { status: 400, message: 'Incorrect code. Please check your email and try again.' };

  if (!email || typeof email !== 'string' || !isOtpShaped(otp)) {
    return { error: wrong };
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+resetOtpHash');
  if (!user || !user.resetOtpHash || !user.resetOtpExpires) {
    return { error: expired };
  }

  if (user.resetOtpExpires.getTime() < Date.now()) {
    await clearOtp(user);
    return { error: expired };
  }

  const tooManyAttempts: OtpFailure = {
    status: 429,
    message: 'Too many incorrect attempts. Please request a new code.'
  };

  if ((user.resetOtpAttempts || 0) >= OTP_MAX_ATTEMPTS) {
    await clearOtp(user);
    return { error: tooManyAttempts };
  }

  if (!(await user.compareResetOtp(otp.trim()))) {
    user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
    const remaining = OTP_MAX_ATTEMPTS - user.resetOtpAttempts;
    if (remaining <= 0) {
      await clearOtp(user);
      return { error: tooManyAttempts };
    }
    await user.save();
    return { error: { status: 400, message: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` } };
  }

  return { user };
}

async function clearOtp(user: any) {
  user.resetOtpHash = undefined;
  user.resetOtpExpires = undefined;
  user.resetOtpAttempts = 0;
  await user.save();
}

userRoutes.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name, password, targetRole, seniority } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Registering an existing email must never overwrite that account or hand
    // back a session for it — that is account takeover, not an update.
    if (await User.exists({ email: cleanEmail })) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in instead.' });
    }

    const user = await User.create({
      email: cleanEmail,
      name: name.trim(),
      password,
      targetRole: targetRole || 'Candidate',
      seniority: seniority || 'Mid-Level'
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in instead.' });
    }
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

userRoutes.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // One message for every failure mode, so login cannot be used to discover
    // which email addresses have accounts.
    const invalid = { message: 'Enter your correct email or password' };

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return res.status(400).json(invalid);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(invalid);
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

userRoutes.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(currentUserId(req));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: publicUser(user) });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to fetch user' });
  }
});

userRoutes.put('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, email, targetRole, seniority, currentPassword, newPassword } = req.body;

    const user = await User.findById(currentUserId(req)).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    if (email && typeof email === 'string' && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== user.email) {
        const existing = await User.findOne({ email: cleanEmail });
        if (existing && existing._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'This email is already in use by another account.' });
        }
        user.email = cleanEmail;
      }
    }

    if (targetRole !== undefined && typeof targetRole === 'string') {
      user.targetRole = targetRole.trim();
    }

    if (seniority !== undefined && typeof seniority === 'string') {
      user.seniority = seniority.trim();
    }

    if (newPassword !== undefined) {
      if (typeof newPassword !== 'string' || newPassword.trim().length < MIN_PASSWORD_LENGTH) {
        return res.status(400).json({ message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
      }
      // A stolen session must not be enough to seize the account outright.
      if (user.password && !(await user.comparePassword(String(currentPassword || '')))) {
        return res.status(400).json({ message: 'Current password does not match.' });
      }
      user.password = newPassword.trim();
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile and account details updated successfully.',
      token: signToken(user),
      user: publicUser(user)
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to update profile' });
  }
});

// Step 1 — confirm the account exists, then email a one-time code.
// NOTE: this deliberately reveals whether an email is registered (product
// decision). forgotPasswordLimiter is what keeps it from becoming a bulk
// account-discovery oracle.
userRoutes.post('/forgot-password', forgotPasswordLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        message: 'No account found with this email address. Please check the address or create an account.',
        code: 'ACCOUNT_NOT_FOUND'
      });
    }

    const otp = generateOtp();
    user.resetOtpHash = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    user.resetOtpAttempts = 0;
    await user.save();

    console.log(`[Auth] Password reset code requested for ${cleanEmail}.`);
    const sent = await sendPasswordResetOtp(cleanEmail, user.name || 'Candidate', otp, OTP_TTL_MINUTES);
    if (!sent.success) {
      // Don't strand the user on the OTP screen waiting for an email that failed.
      await clearOtp(user);
      return res.status(502).json({
        message: 'We could not send the code right now. Please try again in a moment.',
        code: 'EMAIL_SEND_FAILED'
      });
    }

    return res.json({
      success: true,
      message: `We sent a ${OTP_LENGTH}-digit code to ${cleanEmail}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      email: cleanEmail,
      expiresInMinutes: OTP_TTL_MINUTES
    });
  } catch (err: any) {
    console.error('[Auth] Password reset request failed:', err?.message || err);
    return res.status(500).json({ message: 'Failed to process password reset request.' });
  }
});

// Step 2 — check the code without consuming it, so the UI can advance to the
// password screen. reset-password re-checks before it changes anything.
userRoutes.post('/verify-otp', authLimiter, async (req: Request, res: Response) => {
  try {
    const result = await loadUserByValidOtp(req.body?.email, req.body?.otp);
    if ('error' in result) {
      return res.status(result.error.status).json({ message: result.error.message });
    }
    return res.json({ success: true, message: 'Code verified. You can now set a new password.' });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Failed to verify code.' });
  }
});

// Step 3 — set the new password. The code is verified again here and burned on
// success, so a verified code cannot be replayed.
userRoutes.post('/reset-password', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp, password } = req.body;

    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
    }

    const result = await loadUserByValidOtp(email, otp);
    if ('error' in result) {
      return res.status(result.error.status).json({ message: result.error.message });
    }

    const { user } = result;
    user.password = password;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    console.log(`[Auth] Password successfully updated for user: ${user.email}`);

    return res.json({
      success: true,
      message: 'Your password has been changed successfully. You can now log in.'
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Failed to reset password.' });
  }
});

export const authRouter = userRoutes;
export default userRoutes;
