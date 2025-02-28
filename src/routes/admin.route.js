import express from "express";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getAnalyticsDashboard,
  getUserActivity,
  getCreditStats,
  deleteUser,
  promoteUserToAdmin,
  getAllUsers,
  getRequestHistory,
  resetUserCredits,
} from "../controllers/admin.controller.js";

import {
  exportAnalyticsReport,
} from "../controllers/export.controller.js";

const router = express.Router();

// Main analytics dashboard
router.get("/analytics", authenticateToken, isAdmin, getAnalyticsDashboard);

// User activity logs
router.get("/user-activity", authenticateToken, isAdmin, getUserActivity);
router.get("/users", authenticateToken, isAdmin, getAllUsers);
router.get("/credit-history", authenticateToken, isAdmin, getRequestHistory);

// Credit usage statistics
router.get("/credit-stats", authenticateToken, isAdmin, getCreditStats);
router.post("/users/:userId/reset-credits", authenticateToken, isAdmin, resetUserCredits);

// user control
router.delete('/users/:userId', authenticateToken, isAdmin, deleteUser);
router.post('/users/:userId/promote', authenticateToken, promoteUserToAdmin);

// export analytics PDF
router.get('/export/analytics', authenticateToken, isAdmin, exportAnalyticsReport);


export default router;
