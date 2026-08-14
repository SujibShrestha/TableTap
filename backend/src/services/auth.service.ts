import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/token.js";

interface loginData {
  email: string;
  password: string;
}

function getRefreshExpiry() {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function getAccessExpiryDate() {
  const expiry = process.env.ACCESS_TOKEN_EXPIRY ?? "15m";
  const match = expiry.match(/^(\d+)([smhd])$/i);

  if (!match) {
    return new Date(Date.now() + 15 * 60 * 1000);
  }

  const value = Number(match[1]!);
  const unit = match[2]!.toLowerCase();
  const multiplier = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit as "s" | "m" | "h" | "d"];

  return new Date(Date.now() + value * multiplier);
}

export async function login(data: loginData) {
  try {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required");
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user || !user.isActive) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshExpiry(),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

    const { passwordHash, ...safeUser } = user;

    return { user: safeUser,accessToken, refreshToken };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Login failed");
  }
}

export async function refreshSession(refreshToken: string) {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !storedToken ||
    storedToken.revoked ||
    storedToken.expiresAt < new Date() ||
    !storedToken.user.isActive
  ) {
    throw new Error("Invalid or expired refresh token");
  }

  const accessToken = generateAccessToken(storedToken.user.id, storedToken.user.role);
  const nextRefreshToken = generateRefreshToken();

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    }),
    prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: hashToken(nextRefreshToken),
        expiresAt: getRefreshExpiry(),
      },
    }),
    prisma.user.update({
      where: { id: storedToken.user.id },
      data: { lastLoginAt: new Date() },
    }),
  ]);

  const { passwordHash, ...safeUser } = storedToken.user;

  return {
    accessToken,
    refreshToken: nextRefreshToken,
    expiresAt: getAccessExpiryDate(),
    user: safeUser,
  };
}

export async function logoutSession(refreshToken: string) {
  if (!refreshToken) {
    throw new Error("Refresh token is required");
  }

  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revoked: false,
    },
    data: {
      revoked: true,
    },
  });
}