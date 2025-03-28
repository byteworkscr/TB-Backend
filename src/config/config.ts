// config.ts

export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Use true if in production
  sameSite: 'Strict', // Adjust as necessary
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

// Add any other configuration constants you may need
export const ALLOWED_REFRESH_ORIGINS = [
  // Add your allowed origins here
];
