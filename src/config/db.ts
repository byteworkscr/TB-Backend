import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

dotenv.config();

const pgp = pgPromise();

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true'
    ? { 
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false', 
        ca: process.env.DB_CA_CERT || undefined 
      }
    : false,
};

const db = pgp(dbConfig);

const MIN_TOKEN_EXPIRY = 15 * 60 * 1000; 
const MAX_TOKEN_EXPIRY = 30 * 60 * 1000; 

const DEFAULT_TOKEN_EXPIRY = MIN_TOKEN_EXPIRY; 

const config = {
  EMAIL_TOKEN_EXPIRY: Math.min(
    Math.max(Number(process.env.EMAIL_TOKEN_EXPIRY) || DEFAULT_TOKEN_EXPIRY, MIN_TOKEN_EXPIRY),
    MAX_TOKEN_EXPIRY
  ),
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
};

// Combine db and config into a single export
const database = {
  db,
  config,
};

// Export the unified database object
export default database;
export { dbConfig, config };
