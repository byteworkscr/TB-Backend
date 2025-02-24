import passport from 'passport';
import { Strategy as CustomStrategy } from 'passport-custom';
import { findUserByWalletAddress, createUser, updateUserNonce, updateLastLogin } from '../models/user';
import { verifySignature } from '../services/blockchainService';
import { Request } from 'express';

// Augment the Express.User type to include our user properties
declare global {
  namespace Express {
    interface User {
      walletAddress: string;
    }
  }
}

passport.use('wallet', new CustomStrategy(async (req: Request, done: any) => {
  try {
    const { walletAddress, signature } = req.body;

    if (!walletAddress || !signature) {
      return done(null, false, { message: 'Missing required fields', status: 400 });
    }

    let user = findUserByWalletAddress(walletAddress);

    if (!user || !user.nonce) {
      return done(null, false, { message: 'User not found or nonce missing', status: 400 });
    }

    const message = `Sign this message to authenticate with TrustBridge: ${user.nonce}`;
    const isValidSignature = verifySignature(message, signature, walletAddress);

    if (!isValidSignature) {
      return done(null, false, { message: 'Invalid signature', status: 401 });
    }

    // Update nonce and last login time
    await updateUserNonce(user);
    updateLastLogin(user);

    return done(null, { walletAddress: user.walletAddress });
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: Express.User, done) => {
  done(null, user.walletAddress);
});

passport.deserializeUser((walletAddress: string, done) => {
  const user = findUserByWalletAddress(walletAddress);
  done(null, user ? { walletAddress: user.walletAddress } : null);
});

export default passport; 