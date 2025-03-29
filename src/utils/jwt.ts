import jwt from "jsonwebtoken";
import { User } from "../models/user";
import { type IJWTPayload } from "../interfaces";
import { IAuthUser } from "../interfaces";


const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";

// Cookie configuration for refresh tokens
export const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
export const COOKIE_CONFIG = {
  httpOnly: true, // Prevents JavaScript access to the cookie
  secure: process.env.NODE_ENV === "production", // Only sent over HTTPS in production
  sameSite: "strict" as const, // Restricts cookie to same-site requests
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  path: "/api/auth", // Only sent to auth routes
};

// Allowed origins for refresh token requests (CSRF protection)
export const ALLOWED_REFRESH_ORIGINS = [
  "http://localhost:3000",
  "https://trustbridge.com",
  // Add any other valid origins
];

export interface JWTPayload {
  walletAddress: string;
  type: "access" | "refresh";
  origin?: string; // Origin used when generating the token
}

export const generateAccessToken = (user: IAuthUser): string => {
  return jwt.sign(
    { walletAddress: user.walletAddress, type: "access" } as IJWTPayload,
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};


export const generateRefreshToken = (user: IAuthUser, origin?: string): string => {
  return jwt.sign(
    {
      walletAddress: user.walletAddress,
      type: "refresh",
      origin, // Store the origin in the token
    } as JWTPayload,
    REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

export const verifyAccessToken = (token: string): IJWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): IJWTPayload => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;
};
