import fs from "fs";
import User from "../models/user.model.js";
import Document from "../models/document.model.js";
import Scan from "../models/scan.model.js";
import Credit from "../models/credit.model.js"; 
import {
  readTextFromFile,
  compareDocumentsWithAI,
  calculateSimilarityScore,
} from "../utils/textSimilarity.js";
import DB from "../db.js";

export const uploadAndScanDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const userId = req.user.id;

    // Deduct one credit for scanning
    try {
      await Credit.deductCredit(userId);
    } catch (error) {
      // If error occurs during credit deduction, clean up file and return error
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        message: "Insufficient credits for scanning",
        error: error.message,
      });
    }

    // Read file content
    const fileContent = await readTextFromFile(req.file.path);

    // Create document record in database
    const document = await Document.create(
      userId,
      req.file.originalname,
      fileContent
    );

    // Create scan history record
    const scanRecord = await Scan.createScanRecord(userId, document.id);

    // Get all other documents to compare against
    const allDocuments = await Document.getAllDocuments();
    const otherDocuments = allDocuments.filter((doc) => doc.id !== document.id);

    // Store match results
    const matchPromises = otherDocuments.map(async (doc) => {
      let similarityScore;

      if (req.query.useAI === "true") {
        // Use AI-based similarity if requested
        try {
          similarityScore = await compareDocumentsWithAI(
            fileContent,
            doc.content
          );
        } catch (error) {
          console.error(
            "AI comparison failed, falling back to basic comparison",
            error
          );
          similarityScore = calculateSimilarityScore(fileContent, doc.content);
        }
      } else {
        // Use basic similarity calculation
        similarityScore = calculateSimilarityScore(fileContent, doc.content);
      }

      // Only store results if similarity is above threshold (e.g., 10%)
      if (similarityScore >= 10) {
        return Scan.saveScanResults(scanRecord.id, doc.id, similarityScore);
      }
      return null;
    });

    await Promise.all(matchPromises.filter((p) => p !== null));

    // Get scan results
    const results = await Scan.getScanResults(scanRecord.id);

    // Update user profile
    const userProfile = await User.getUserProfile(userId);

    // Return result
    res.status(200).json({
      message: "Document scanned successfully",
      scan: {
        id: scanRecord.id,
        documentId: document.id,
        filename: req.file.originalname,
        scanDate: scanRecord.scanDate,
      },
      matchResults: results,
      userCredits: userProfile.credits,
    });
  } catch (error) {
    console.error("Error scanning document:", error);

    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Failed to delete file after error:", unlinkError);
      }
    }

    res.status(500).json({
      message: "Error scanning document",
      error: error.message,
    });
  }
};

export const getMatchesForDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const userId = req.user.id;

    // Verify the document exists and belongs to the user
    const document = await Document.findById(docId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (document.user_id !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Document belongs to another user" });
    }

    // Find the most recent scan for this document
    const scanHistory = await DB.get(
      "SELECT id FROM scan_history WHERE document_id = ? ORDER BY scan_date DESC LIMIT 1",
      [docId]
    );

    if (!scanHistory) {
      return res
        .status(404)
        .json({ message: "No scan history found for this document" });
    }

    // Get the match results
    const results = await Scan.getScanResults(scanHistory.id);

    res.status(200).json({
      message: "Match results retrieved successfully",
      document: {
        id: document.id,
        filename: document.filename,
        uploadDate: document.upload_date,
      },
      scanId: scanHistory.id,
      matches: results,
    });
  } catch (error) {
    console.error("Error getting document matches:", error);
    res.status(500).json({
      message: "Error retrieving document matches",
      error: error.message,
    });
  }
};

export const getUserScans = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all scans for this user
    const scans = await Scan.getUserScans(userId);

    res.status(200).json({
      message: "User scans retrieved successfully",
      scans,
    });
  } catch (error) {
    console.error("Error getting user scans:", error);
    res.status(500).json({
      message: "Error retrieving user scans",
      error: error.message,
    });
  }       
};
