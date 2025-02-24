import { Parser } from "json2csv";
import DB from "../db.js";
import { createObjectCsvStringifier } from "csv-writer";
import archiver from "archiver";
import fs from "fs";
import path from "path";

// Export scan history for a user
export const exportScanHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || "csv";

    // Get user's scan history with details
    const scanHistory = await new Promise((resolve, reject) => {
      DB.all(
        `SELECT 
          sh.scan_date,
          d.filename,
          d.content as scanned_content,
          GROUP_CONCAT(mr.similarity_score) as similarity_scores,
          GROUP_CONCAT(md.filename) as matched_documents
         FROM scan_history sh
         JOIN documents d ON sh.document_id = d.id
         LEFT JOIN match_results mr ON sh.id = mr.scan_id
         LEFT JOIN documents md ON mr.matched_doc_id = md.id
         WHERE sh.user_id = ?
         GROUP BY sh.id
         ORDER BY sh.scan_date DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (format === "csv") {
      const parser = new Parser({
        fields: [
          "scan_date",
          "filename",
          "similarity_scores",
          "matched_documents",
        ],
      });
      const csv = parser.parse(scanHistory);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=scan_history.csv"
      );
      return res.send(csv);
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=scan_history.json"
      );
      return res.json(scanHistory);
    } else {
      throw new Error("Unsupported export format");
    }
  } catch (error) {
    console.error("Error exporting scan history:", error);
    res.status(500).json({
      message: "Error exporting scan history",
      error: error.message,
    });
  }
};

// Export analytics report for admins
export const exportAnalyticsReport = async (req, res) => {
  try {
    const format = req.query.format || "csv";

    // Gather analytics data
    const [userStats, scanStats, creditStats] = await Promise.all([
      // User statistics
      new Promise((resolve, reject) => {
        DB.all(
          `SELECT 
            u.username,
            COUNT(DISTINCT sh.id) as total_scans,
            COUNT(DISTINCT d.id) as total_documents,
            u.credits as current_credits
           FROM users u
           LEFT JOIN scan_history sh ON u.id = sh.user_id
           LEFT JOIN documents d ON u.id = d.user_id
           GROUP BY u.id`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      }),

      // Scan statistics
      new Promise((resolve, reject) => {
        DB.all(
          `SELECT 
            DATE(scan_date) as date,
            COUNT(*) as scan_count,
            AVG(similarity_score) as avg_similarity
           FROM scan_history sh
           LEFT JOIN match_results mr ON sh.id = mr.scan_id
           GROUP BY DATE(scan_date)
           ORDER BY date DESC
           LIMIT 30`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      }),

      // Credit statistics
      new Promise((resolve, reject) => {
        DB.all(
          `SELECT 
            DATE(request_date) as date,
            COUNT(*) as request_count,
            SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as credits_approved,
            SUM(CASE WHEN status = 'denied' THEN amount ELSE 0 END) as credits_denied
           FROM credit_requests
           GROUP BY DATE(request_date)
           ORDER BY date DESC
           LIMIT 30`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      }),
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      userStatistics: userStats,
      scanStatistics: scanStats,
      creditStatistics: creditStats,
    };

    if (format === "csv") {
      // Create CSV strings for each section
      const userCsv = new Parser({
        fields: [
          "username",
          "total_scans",
          "total_documents",
          "current_credits",
        ],
      }).parse(userStats);

      const scanCsv = new Parser({
        fields: ["date", "scan_count", "avg_similarity"],
      }).parse(scanStats);

      const creditCsv = new Parser({
        fields: ["date", "request_count", "credits_approved", "credits_denied"],
      }).parse(creditStats);

      // Create archive stream
      const archive = archiver("zip");
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=analytics_report.zip"
      );
      archive.pipe(res);

      // Add files to archive
      archive.append(userCsv, { name: "user_statistics.csv" });
      archive.append(scanCsv, { name: "scan_statistics.csv" });
      archive.append(creditCsv, { name: "credit_statistics.csv" });

      // Finalize archive
      await archive.finalize();
    } else if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=analytics_report.json"
      );
      return res.json(report);
    } else {
      throw new Error("Unsupported export format");
    }
  } catch (error) {
    console.error("Error exporting analytics report:", error);
    res.status(500).json({
      message: "Error exporting analytics report",
      error: error.message,
    });
  }
};
