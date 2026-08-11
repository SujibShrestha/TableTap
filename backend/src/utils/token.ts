import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export function generateAccessToken(userId: string, role: string) {
  const options: SignOptions = {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY as NonNullable<SignOptions['expiresIn']>,
  };

  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_ACCESS_SECRET!,
    options
  );
}

export function generateRefreshToken() {
  // random opaque token — not a JWT, just a secure random string
  return crypto.randomBytes(40).toString('hex');
}

export function hashToken(token: string) {
  // store only the hash in DB — same principle as password hashing
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
    sub: string;
    role: string;
  };
}