import prisma from "../config/prisma";
import { User } from "./user";
import {
  countActiveRefreshTokens,
  enforceTokenLimit,
  MAX_ACTIVE_TOKENS_PER_USER,
} from "./tokenLimit";

export {
  countActiveRefreshTokens,
  enforceTokenLimit,
  MAX_ACTIVE_TOKENS_PER_USER,
};

export interface DeviceInfo {
  device: string | null; // Device type (mobile, desktop, etc.)
  deviceId: string | null; // Unique identifier for the device
  userAgent: string | null; // Browser/app user agent
  ipAddress: string | null; // IP address of the request
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  isRevoked: boolean;
  family: string | null; // Token family identifier for tracking lineage
  replacedByToken: string | null; // The token that replaced this one
  device: string | null; // Device information
  deviceId: string | null; // Unique identifier for the device
  userAgent: string | null; // User agent string
  ipAddress: string | null; // IP address
}

// Generate a new family ID for fresh login sessions
export const generateTokenFamily = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const createRefreshToken = async (
  user: User,
  token: string,
  deviceInfo?: DeviceInfo,
  family?: string,
  previousToken?: string
): Promise<RefreshToken> => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  // Generate a new family ID if none provided (for new login sessions)
  const tokenFamily = family || generateTokenFamily();

  // If we have a previous token, mark it as replaced
  if (previousToken) {
    await prisma.refreshToken.update({
      where: { token: previousToken },
      data: { replacedByToken: token },
    });
  }

  // Create the new token
  const refreshToken = await prisma.refreshToken.create({
    data: {
      token,
      userId: user.walletAddress,
      type: "REFRESH", 
      expiresAt,
      isRevoked: false,
      family: tokenFamily,
      device: deviceInfo?.device,
      deviceId: deviceInfo?.deviceId,
      userAgent: deviceInfo?.userAgent,
      ipAddress: deviceInfo?.ipAddress,
    },
  });

  // If this is a new login (not a refresh), enforce token limits
  if (!previousToken) {
    await enforceTokenLimit(user.walletAddress);
  }

  return refreshToken;
};

export const findRefreshToken = async (
  token: string
): Promise<RefreshToken | null> => {
  return await prisma.refreshToken.findFirst({
    where: {
      token,
      isRevoked: false,
      expiresAt: {
        gt: new Date(), // not expired
      },
    },
  });
};

export const cleanupExpiredTokens = async (): Promise<number> => {
  const { count } = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(), // Deletes tokens where expiresAt is less than current time
      },
    },
  });

  return count;
};

/**
 * Detect potential reuse of a refresh token by checking if a token has already been replaced
 * @param token The token to check for reuse
 * @returns True if the token has been reused, false otherwise
 */
export const detectTokenReuse = async (token: string): Promise<boolean> => {
  const usedToken = await prisma.refreshToken.findFirst({
    where: { token },
  });

  // If token doesn't exist or is already revoked, that's fine
  if (!usedToken || usedToken.isRevoked) {
    return false;
  }

  // If this token has been replaced by a newer token, it's being reused
  return usedToken.replacedByToken !== null;
};

/**
 * Handle a potential token reuse by revoking all tokens in the same family
 * @param token The token that was reused
 * @returns void
 */
export const handleTokenReuse = async (token: string): Promise<void> => {
  const usedToken = await prisma.refreshToken.findFirst({
    where: { token },
  });

  if (!usedToken) return;

  // Revoke all tokens in the same family
  await prisma.refreshToken.updateMany({
    where: { family: usedToken.family },
    data: { isRevoked: true },
  });
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.update({
    where: { token },
    data: { isRevoked: true },
  });
};

export const revokeAllUserRefreshTokens = async (
  userId: string
): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
};

/**
 * Revoke all refresh tokens for a user on a specific device
 * @param userId The user ID
 * @param deviceId The device ID
 */
export const revokeDeviceRefreshTokens = async (
  userId: string,
  deviceId: string
): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      deviceId,
    },
    data: { isRevoked: true },
  });
};

/**
 * Get all active devices for a user based on their refresh tokens
 * @param userId The user ID
 * @returns Array of unique device information
 */
export const getUserActiveDevices = async (
  userId: string
): Promise<DeviceInfo[]> => {
  const activeTokens = await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    distinct: ["deviceId"],
    select: {
      device: true,
      deviceId: true,
      userAgent: true,
      ipAddress: true,
    },
  });

  return activeTokens as DeviceInfo[];
};

/**
 * Get the token family for a specific refresh token
 * @param token The refresh token
 * @returns The family identifier or null if the token isn't found
 */
export const getTokenFamily = async (token: string): Promise<string | null> => {
  const foundToken = await prisma.refreshToken.findFirst({
    where: { token },
  });

  return foundToken?.family || null;
};
