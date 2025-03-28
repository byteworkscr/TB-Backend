import { NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

// Validation for the register route
const validateRegister = [
  body('walletAddress')
    .isString()
    .withMessage('Wallet address is required')
    .isLength({ min: 1 })
    .withMessage('Wallet address cannot be empty'),
  // Add any other validations as necessary
];

// Validation for the verify email route
const validateVerifyEmail = [
  body('token')
    .isString()
    .withMessage('Token is required')
    .isLength({ min: 1 })
    .withMessage('Token cannot be empty'),
  // Add any other validations as necessary
];

// Middleware to check for validation errors
const checkValidationResult = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status
  }
  next();
};

export { validateRegister, validateVerifyEmail, checkValidationResult };
