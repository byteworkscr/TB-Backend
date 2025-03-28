import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import { verifyAccessToken, REFRESH_TOKEN_COOKIE_NAME } from "../utils/jwt";
import { isTokenRevoked } from '../services/tokenService';
import { findRefreshToken } from '../models/refreshToken';

interface AuthInfo {
  message?: string;
  status?: number;
}

interface AuthUser {
  walletAddress: string;
}

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const [bearer, token] = authHeader.split(" ");

    if (bearer !== "Bearer" || !token) {
      res.status(401).json({ error: "Invalid token format" });
      return;
    }

    const payload = verifyAccessToken(token);
    
    // Check if the token is revoked
    const isRevoked = await isTokenRevoked(token);
    if (isRevoked) {
      res.status(401).json({ error: "Token has been revoked" });
      return;
    }

    // Check if there's a valid refresh token
    const refreshToken = getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token found" });
      return;
    }

    // Verify the refresh token is valid and not revoked
    const storedRefreshToken = await findRefreshToken(refreshToken);
    if (!storedRefreshToken) {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    // Set the user in the request
    req.user = { walletAddress: payload.walletAddress };
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "JsonWebTokenError") {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};

/**
 * Get refresh token from cookie if available
 */
export const getRefreshTokenFromCookie = (req: Request): string | null => {
  if (req.cookies && req.cookies[REFRESH_TOKEN_COOKIE_NAME]) {
    return req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  }
  return null;
};

export const isLender = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.walletAddress;

    if (!userId) {
      res
        .status(401)
        .json({ error: "Unauthorized - User not authenticated properly" });
      return;
    }

    const userRole = await prisma.role.findMany({
      where: {
        users: {
          some: {
            userId: userId,
          },
        },
        name: "lender",
      },
    });

    if (userRole.length === 0) {
      res.status(403).json({
        error: "Forbidden - You do not have access to the audit logs",
      });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
    return;
  }
};

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  passport.authenticate(
    "wallet",
    (err: Error | null, user: AuthUser | false, info: AuthInfo) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        const status =
          info?.status || (info?.message?.includes("not found") ? 400 : 401);
        res
          .status(status)
          .json({ error: info?.message || "Authentication failed" });
        return;
      }
      req.logIn(user, (err) => {
        if (err) {
          next(err);
          return;
        }
        next();
      });
    }
  )(req, res, next);
};

// Custom error handler for authentication
export const handleAuthError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err.name === "AuthenticationError") {
    res.status(401).json({ error: err.message });
    return;
  }
  next(err);
};


export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate recovery token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    // Store the token in the DB (optional but good for reference)
    await prisma.user.update({
      where: { email },
      data: { 
        resetToken: token 

      },
    });

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Define mail options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click the link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${token}`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent successfully' });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }
};


export const resetPassword = async (req: Request, res: Response) => {
  const { token, new_password } = req.body;

  try {
    // Verify the JWT token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // Find the user from the decoded token
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      res.status(400).json({ error: 'Invalid token or user not found' });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the user's password in the database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null }, // Remove the token after use
    });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

