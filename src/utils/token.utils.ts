const nodeCrypto = require('crypto'); // Rename to avoid conflict
const prisma = require('../prisma/client');
const config = require('../config/config');

/**
 * Generate a verification token for a user
 * @param {string} userId - User ID
 * @returns {Promise<string>} Generated token
 */
const generateVerificationToken = async (userId:string) => {
  const token = nodeCrypto.randomBytes(32).toString('hex'); // Use nodeCrypto instead of crypto
  
  // Create a new token with revoked field set to false by default
  await prisma.token.create({
    data: {
      token,
      type: 'verification',
      userId,
      expiresAt: new Date(Date.now() + config.EMAIL_TOKEN_EXPIRY),
      revoked: false // Add the revoked field with default value
    }
  });
  
  return token;
};

/**
 * Verify a token is valid
 * @param {string} token - Token to verify
 * @returns {Promise<string>} User ID if token is valid
 * @throws {Error} If token is invalid, expired or revoked
 */
const verifyToken = async (token: string) => {
  const tokenRecord = await prisma.token.findUnique({
    where: { token }
  });
  
  if (!tokenRecord || tokenRecord.type !== 'verification') {
    throw new Error('Invalid or expired token');
  }
  
  if (tokenRecord.expiresAt < new Date()) {
    // Mark as revoked instead of deleting
    await prisma.token.update({
      where: { id: tokenRecord.id },
      data: { revoked: true }
    });
    throw new Error('Token has expired');
  }
  
  if (tokenRecord.revoked) {
    throw new Error('Token has been revoked');
  }
  
  return tokenRecord.userId;
};

/**
 * Revoke a specific token
 * @param {string} token - Token to revoke
 * @returns {Promise<boolean>} True if token was revoked
 */
const revokeToken = async (token: string) => {
  try {
    await prisma.token.update({
      where: { token },
      data: { revoked: true }
    });
    return true;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
};

/**
 * Revoke all tokens for a specific user
 * @param {string} userId - User ID
 * @param {string} [type] - Optional token type
 * @returns {Promise<number>} Number of tokens revoked
 */
const revokeUserTokens = async (userId: string, type?: string): Promise<number> => {
  const where: { userId: string; revoked: boolean; type?: string } = {
    userId,
    revoked: false,
    ...(type && { type }) // Conditionally add 'type' only if it's provided
  };

  const result = await prisma.token.updateMany({
    where,
    data: { revoked: true }
  });

  return result.count;
};

/**
 * Clean up expired tokens (maintenance function)
 * Marks all expired tokens as revoked
 * @returns {Promise<number>} Number of tokens marked as revoked
 */
const cleanupExpiredTokens = async () => {
  const result = await prisma.token.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      revoked: false
    },
    data: { revoked: true }
  });
  
  return result.count;
};

module.exports = {
  generateVerificationToken,
  verifyToken,
  revokeToken,
  revokeUserTokens,
  cleanupExpiredTokens
};