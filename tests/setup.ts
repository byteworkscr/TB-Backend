import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SESSION_SECRET = 'test-session-secret'; 