import express from "express";
import {
  requestCredits,
  approveCredit,
  denyCredit,
  resetDailyCredits,
  getPendingCreditRequests,
} from "../controllers/credit.controller.js";
import { authenticateToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Route for users to request more credits
router.post("/request", authenticateToken, requestCredits);

// Admin routes for managing credit requests
router.get("/pending", authenticateToken, isAdmin, getPendingCreditRequests);
router.post("/approve/:requestId", authenticateToken, isAdmin, approveCredit);
router.post("/deny/:requestId", authenticateToken, isAdmin, denyCredit);
router.post("/reset-daily", authenticateToken, isAdmin, resetDailyCredits);

export default router;
