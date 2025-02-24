import express, { Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import blockchainService from '../services/blockchainService';

const router = express.Router();

// Public route - Get available loans
router.get('/available', (req: Request, res: Response) => {
  blockchainService.getAvailableLoans()
    .then(loans => {
      res.json({ success: true, data: loans });
    })
    .catch(error => {
      console.error('Error fetching loans:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch loans' });
    });
});

// Protected route - Specific loan details
router.get('/:id', isAuthenticated, (req: Request, res: Response) => {
  const loanId = req.params.id;
  // In a real implementation, you would fetch this loan from the blockchain
  res.json({ 
    success: true, 
    data: { 
      id: loanId, 
      amount: '500', 
      interest: '4%', 
      duration: '45 days',
      borrower: req.user?.walletAddress || 'unknown',
      status: 'active'
    } 
  });
});

export default router;