import express from "express";
import {
  register,
  login,
  getUserProfile,
} from "../controllers/user.controller.js";


import {
  exportScanHistory
} from "../controllers/export.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Register new user
router.post("/register", register);

// Login user
router.post("/login", login);

// Get user profile (protected route)
router.get("/user/profile", authenticateToken, getUserProfile);

// export history scan
router.get("/export/scan-history", authenticateToken, exportScanHistory);

export default router;
