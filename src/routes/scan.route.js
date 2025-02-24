import express from "express";
import {
  uploadAndScanDocument,
  getMatchesForDocument,
  getUserScans,
} from "../controllers/scan.controller.js";
import {
  authenticateToken,
  checkCredits,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

// Route to upload and scan a document
// Requires authentication and having credits available
router.post("/upload", authenticateToken, checkCredits, upload.single("document"), uploadAndScanDocument);

// Route to get matches for a specific document
router.get("/matches/:docId", authenticateToken, getMatchesForDocument);

// Route to get all scans for the current user
router.get("/history", authenticateToken, getUserScans);

export default router;
