import prisma from "../config/prisma";

import {
  countActiveRefreshTokens,
  enforceTokenLimit,
  MAX_ACTIVE_TOKENS_PER_USER,
} from "./tokenLimit";
import { IDeviceInfo,IRefreshToken,IAuthUser } from "../interfaces";

export {
  countActiveRefreshTokens,
  enforceTokenLimit,
  MAX_ACTIVE_TOKENS_PER_USER,
};



// Generate a new family ID for fresh login sessions
export const generateTokenFamily = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const createRefreshToken = async (
  user: IAuthUser,
  token: string,
  deviceInfo?: IDeviceInfo,
  family?: string,
  previousToken?: string
): Promise<IRefreshToken> => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  return await prisma.refreshToken.create({
    data: {
      userId: user.walletAddress,
      type: "REFRESH", 
      expiresAt,
      isRevoked: false,
      family,
      token,
      replacedByToken: previousToken ,
      ...deviceInfo,
    },
  });
};


export const findRefreshToken = async (
  token: string
): Promise<IRefreshToken | null> => {
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
): Promise<IDeviceInfo[]> => {
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

  return activeTokens as IDeviceInfo[];
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