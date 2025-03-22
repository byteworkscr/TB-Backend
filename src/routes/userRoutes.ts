import express, { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router: Router = express.Router();

// PUT /users/profile - Update user profile
router.put('/profile', isAuthenticated, userController.updateProfile);

export default router;