const crypto = require('crypto');
const prisma = require('../prisma/client');
const config = require('../config/config');

const generateVerificationToken = async (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  // Create a new token
  await prisma.token.create({
    data: {
      token,
      type: 'verification',
      userId,
      expiresAt: new Date(Date.now() + config.EMAIL_TOKEN_EXPIRY)
    }
  });
  
  return token;
};

const verifyToken = async (token) => {
  const tokenRecord = await prisma.token.findUnique({
    where: { token }
  });
  
  if (!tokenRecord || tokenRecord.type !== 'verification') {
    throw new Error('Invalid or expired token');
  }
  
  if (tokenRecord.expiresAt < new Date()) {
    // Delete expired token
    await prisma.token.delete({
      where: { id: tokenRecord.id }
    });
    throw new Error('Token has expired');
  }
  
  return tokenRecord.userId;
};

module.exports = {
  generateVerificationToken,
  verifyToken
};