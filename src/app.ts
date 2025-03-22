import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from './config/passport';
import loanRoutes from './routes/loanRoutes';
import auditRoutes from './routes/auditRoutes';
import creditScoreRoutes from './routes/creditScoreRoutes';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import blockchainService from './services/blockchainService';
import notificationRoutes from './routes/notificationRoutes';
import { isAuthenticated, isLender } from './middleware/auth';
import db from './config/db';
import userRoutes from './routes/userRoutes';



dotenv.config();
const app = express();

// Middlewares
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Database Connection Check
db.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch((err: any) => console.error('❌ Database connection error:', err));


// Health check route
app.get('/health', async (req, res) => {
  const isConnected = await blockchainService.testConnection();
  res.json({ 
    status: 'ok', 
    blockchain: isConnected ? 'connected' : 'disconnected' 
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/loans', isAuthenticated, loanRoutes); // Protect loan routes
app.use("/api", auditRoutes, creditScoreRoutes);
app.use('/api/audit', isAuthenticated, isLender, auditRoutes); // Protect audit routes
app.use('/api/analytics', isAuthenticated, analyticsRoutes); // Protect analytics routes
app.use('/api/notifications', isAuthenticated, notificationRoutes); // Notification Routes
app.use('/users', isAuthenticated, userRoutes); // User Routes

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;