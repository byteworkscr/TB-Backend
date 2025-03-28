import express, { Request, Response, NextFunction, Router } from 'express';
import passport from 'passport';
import { isAuthenticated, authenticateUser,forgotPassword, resetPassword } from '../middleware/auth';
import expressAsyncHandler from 'express-async-handler';
import {
  findUserByWalletAddress,
  createUser,
  updateUserNonce,
  User,
} from "../models/user";
import {
  ALLOWED_REFRESH_ORIGINS,
  COOKIE_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_COOKIE_NAME,
  verifyRefreshToken,
} from "../utils/jwt";
import {
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  detectTokenReuse,
  handleTokenReuse,
  getTokenFamily,
  revokeDeviceRefreshTokens,
  getUserActiveDevices,
  DeviceInfo,
} from "../models/refreshToken";
import { v4 as uuidv4 } from "uuid";
import errorHandler from '../middleware/errorHandler';
import { sendVerificationEmail}  from '../../src/controllers/authController';
import { verifyEmail } from '../../src/controllers/authController';
import { register } from '../../src/controllers/authController';
import { validateVerifyEmail, checkValidationResult, validateRegister } from '../../src/middleware/validation';

const router: Router = express.Router();

const getDeviceInfo = (req: Request): DeviceInfo => {
  return {
    device: detectDeviceType(req.headers["user-agent"] || ""),
    deviceId: req.body.deviceId || uuidv4(),
    userAgent: req.headers["user-agent"] || null,
    ipAddress: getClientIp(req),
  };
};

const detectDeviceType = (userAgent: string): string => {
  if (/mobile|android|iphone|ipad|ipod/i.test(userAgent.toLowerCase())) {
    return "Mobile";
  } else if (/tablet|ipad/i.test(userAgent.toLowerCase())) {
    return "Tablet";
  } else {
    return "Desktop";
  }
};

const getClientIp = (req: Request): string => {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    req.socket.remoteAddress ||
    ""
  );
};

const validateOrigin = (req: Request): boolean => {
  const requestOrigin = req.headers.origin || "";
  if (!ALLOWED_REFRESH_ORIGINS.length) return true;
  return ALLOWED_REFRESH_ORIGINS.includes(requestOrigin);
};

const getOrigin = (req: Request): string => {
  return req.headers.origin || req.headers.referer || "";
};

router.get("/nonce/:walletAddress", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { walletAddress } = req.params;
    let user = await findUserByWalletAddress(walletAddress);
    if (!user) {
      user = await createUser(walletAddress);
    } else {
      user.nonce = await updateUserNonce(user);
    }
    res.json({ nonce: user.nonce });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as { walletAddress: string };
    const deviceInfo = getDeviceInfo(req);
    const origin = getOrigin(req);
    const accessToken = generateAccessToken({
      walletAddress: user.walletAddress,
      nonce: '',
      createdAt: new Date
    });
    const refreshToken = generateRefreshToken({
      walletAddress: user.walletAddress,
      nonce: '',
      createdAt: new Date
    }, origin);
    await createRefreshToken({
      walletAddress: user.walletAddress,
      nonce: '',
      createdAt: new Date
    }, refreshToken, deviceInfo);
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, COOKIE_CONFIG);
    res.json({
      message: "Successfully authenticated",
      user: { walletAddress: user.walletAddress },
      accessToken,
      deviceId: deviceInfo.deviceId,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!validateOrigin(req)) {
      res.status(403).json({ error: "Invalid origin for token refresh" });
      return;
    }
    const refresh_token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
    if (!refresh_token) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }
    const isReused = await detectTokenReuse(refresh_token);
    if (isReused) {
      await handleTokenReuse(refresh_token);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Token reuse detected - session revoked" });
      return;
    }
    const storedToken = await findRefreshToken(refresh_token);
    if (!storedToken) {
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }
    const payload = verifyRefreshToken(refresh_token);
    const currentOrigin = getOrigin(req);
    if (payload.origin && payload.origin !== currentOrigin && ALLOWED_REFRESH_ORIGINS.length > 0) {
      await handleTokenReuse(refresh_token);
      res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
      res.status(403).json({ error: "Origin mismatch - possible CSRF attempt" });
      return;
    }
    const tokenFamily = await getTokenFamily(refresh_token);
    const deviceInfo: DeviceInfo = {
      device: storedToken.device,
      deviceId: storedToken.deviceId,
      userAgent: req.headers["user-agent"] || storedToken.userAgent,
      ipAddress: getClientIp(req),
    };
    const user = { walletAddress: payload.walletAddress };
    const accessToken = generateAccessToken(user as User);
    const newRefreshToken = generateRefreshToken(user as User, currentOrigin);
    await createRefreshToken(user as User, newRefreshToken, deviceInfo, tokenFamily || undefined, refresh_token);
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, COOKIE_CONFIG);
    res.json({ accessToken });
  } catch (error) {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    next(error);
  }
});

router.post("/forgot-password", expressAsyncHandler(forgotPassword));
router.post("/reset-password", expressAsyncHandler(resetPassword));
router.post("/send-verification-email", expressAsyncHandler(sendVerificationEmail));
router.post("/verify-email", validateVerifyEmail, checkValidationResult, expressAsyncHandler(verifyEmail));
router.post("/register", validateRegister, checkValidationResult, expressAsyncHandler(register));

router.use(errorHandler);

export default router;
