import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy `X-RateLimit-*` headers
});
