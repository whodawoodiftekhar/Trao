import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

export interface IUser extends Document {
  email: string;
  name: string;
  password?: string;
  targetRole?: string;
  seniority?: string;
  resetOtpHash?: string;
  resetOtpExpires?: Date;
  resetOtpAttempts?: number;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  compareResetOtp(candidate: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  // select:false so password hashes never leak into a response by accident.
  // Use `User.findOne(...).select('+password')` where a comparison is needed.
  password: { type: String, required: false, select: false },
  targetRole: { type: String, required: false, default: '' },
  seniority: { type: String, required: false, default: '' },
  // The emailed OTP is only 6 digits, so it is bcrypt-hashed rather than plain
  // SHA-256: a leaked database dump can't be brute-forced back to a live code.
  resetOtpHash: { type: String, required: false, select: false },
  resetOtpExpires: { type: Date, required: false },
  // Guessing ceiling. 6 digits is 1,000,000 combinations — without a cap an
  // attacker just tries them all against a known email address.
  resetOtpAttempts: { type: Number, required: false, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function (next) {
  const user = this as any;
  if (!user.isModified('password') || !user.password) return next();
  user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password || !candidate) return false;
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.compareResetOtp = async function (candidate: string): Promise<boolean> {
  if (!this.resetOtpHash || !candidate) return false;
  return bcrypt.compare(candidate, this.resetOtpHash);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const userModel = User;
export default User;
