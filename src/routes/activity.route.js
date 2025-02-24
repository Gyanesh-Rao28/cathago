import express from 'express';
import { authenticateToken, isAdmin } from '../middlewares/auth.middleware.js';
import {
  getUserActivities,
  getSystemActivities,
  getEnhancedAnalytics,
  getUserAnalytics
} from '../controllers/activity.controller.js';

const router = express.Router();

// User activity routes
router.get('/user/activities', authenticateToken, getUserActivities);
router.get('/user/analytics', authenticateToken, getUserAnalytics);

// Admin routes
router.get('/system/activities', authenticateToken, isAdmin, getSystemActivities);
router.get('/system/analytics', authenticateToken, isAdmin, getEnhancedAnalytics);

export default router;