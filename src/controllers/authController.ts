import { Request, Response } from 'express';
import prisma from '../../src/config/prisma';
const tokenUtils = require('../utils/tokenUtils');
const emailService = require('../services/emailService');
const bcrypt = require('bcrypt');

// Create an endpoint to send a verification email
const sendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Delete any existing verification tokens
    await prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        type: 'REFRESH',
      },
    });

    // Generate a new verification token
    const token = await tokenUtils.generateVerificationToken(user.id);

    // Send verification email
    await emailService.sendVerificationEmail(email, token);

    return res.status(200).json({ message: 'Verification email sent successfully' });
  } catch (error) {
    const err = error as Error; // Type assertion
    console.error('Error sending verification email:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Create an endpoint to verify the email
const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify the token
    const userId = await tokenUtils.verifyToken(token);

    // Update user's email verification status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the used token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token,
        type: 'REFRESH',
      },
    });

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    const err = error as Error; // Type assertion
    console.error('Error verifying email:', err);

    if (err.message === 'Invalid or expired token' || err.message === 'Token has expired') {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

// User registration
const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        isEmailVerified: false,
        name: '',
        nonce: '',
        walletAddress: ''
      },
    });

    // Generate and send verification email
    const token = await tokenUtils.generateVerificationToken(user.id);
    await emailService.sendVerificationEmail(email, token);

    return res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      userId: user.id,
    });
  } catch (error) {
    const err = error as Error; // Type assertion
    console.error('Error registering user:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }


  
};


// Export the functions
export { register, sendVerificationEmail, verifyEmail };
      


