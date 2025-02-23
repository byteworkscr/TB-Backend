import { Request, Response, NextFunction } from 'express';
import blockchainService from '../services/blockchainService';

// Middleware de autenticación sincrono que maneja la promesa internamente
export const verifyWalletAuth = (req: Request, res: Response, next: NextFunction): void => {
  const walletAddress = req.headers.walletaddress as string;
  const signature = req.headers.signature as string;
  
  if (!walletAddress || !signature) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const message = 'authenticate_trustbridge';
  
  // Manejamos la promesa internamente
  blockchainService.verifyWalletSignature(walletAddress, signature, message)
    .then(isValid => {
      if (!isValid) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
      // Implement here issue where we create the user in the database and
      // we associate the roles with it.
      next();
    })
    .catch(error => {
      console.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    });
};