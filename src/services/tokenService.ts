import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Revokes the refresh token by deleting or marking it as revoked.
 */
export const revokeRefreshToken = async (refreshToken: string): Promise<boolean> => {
  const token = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!token) return false;

  await prisma.refreshToken.delete({
    where: { token: refreshToken },
  });

  return true;
};

/**
 * Checks if a JWT access token is revoked.
 */
export const isTokenRevoked = async (token: string): Promise<boolean> => {
  const revokedToken = await prisma.revokedToken.findUnique({
    where: { token },
  });

  return revokedToken !== null;
};
