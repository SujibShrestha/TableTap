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

    return { accessToken, refreshToken, user: safeUser };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Login failed");
  }
}