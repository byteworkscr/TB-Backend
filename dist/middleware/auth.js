"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.handleAuthError = exports.authenticateUser = exports.isLender = exports.getRefreshTokenFromCookie = exports.isAuthenticated = void 0;
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_1 = require("../utils/jwt");
const isAuthenticated = (req, res, next) => {
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
        const payload = (0, jwt_1.verifyAccessToken)(token);
        req.user = { walletAddress: payload.walletAddress };
        next();
    }
    catch (error) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
    }
};
exports.isAuthenticated = isAuthenticated;
/**
 * Get refresh token from cookie if available
 */
const getRefreshTokenFromCookie = (req) => {
    if (req.cookies && req.cookies[jwt_1.REFRESH_TOKEN_COOKIE_NAME]) {
        return req.cookies[jwt_1.REFRESH_TOKEN_COOKIE_NAME];
    }
    return null;
};
exports.getRefreshTokenFromCookie = getRefreshTokenFromCookie;
const isLender = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.walletAddress;
        if (!userId) {
            res
                .status(401)
                .json({ error: "Unauthorized - User not authenticated properly" });
            return;
        }
        const userRole = yield prisma_1.default.role.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
        return;
    }
});
exports.isLender = isLender;
const authenticateUser = (req, res, next) => {
    passport_1.default.authenticate("wallet", (err, user, info) => {
        var _a;
        if (err) {
            next(err);
            return;
        }
        if (!user) {
            const status = (info === null || info === void 0 ? void 0 : info.status) || (((_a = info === null || info === void 0 ? void 0 : info.message) === null || _a === void 0 ? void 0 : _a.includes("not found")) ? 400 : 401);
            res
                .status(status)
                .json({ error: (info === null || info === void 0 ? void 0 : info.message) || "Authentication failed" });
            return;
        }
        req.logIn(user, (err) => {
            if (err) {
                next(err);
                return;
            }
            next();
        });
    })(req, res, next);
};
exports.authenticateUser = authenticateUser;
// Custom error handler for authentication
const handleAuthError = (err, req, res, next) => {
    if (err.name === "AuthenticationError") {
        res.status(401).json({ error: err.message });
        return;
    }
    next(err);
};
exports.handleAuthError = handleAuthError;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Generate recovery token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        // Store the token in the DB (optional but good for reference)
        yield prisma_1.default.user.update({
            where: { email },
            data: { resetToken: token },
        });
        // Configure email transporter
        const transporter = nodemailer_1.default.createTransport({
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
        yield transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Password reset link sent successfully' });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, new_password } = req.body;
    try {
        // Verify the JWT token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Find the user from the decoded token
        const user = yield prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            res.status(400).json({ error: 'Invalid token or user not found' });
            return;
        }
        // Hash the new password
        const hashedPassword = yield bcryptjs_1.default.hash(new_password, 10);
        // Update the user's password in the database
        yield prisma_1.default.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetToken: null }, // Remove the token after use
        });
        res.status(200).json({ message: 'Password reset successful' });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});
exports.resetPassword = resetPassword;
