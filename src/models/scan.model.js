import DB from "../db.js";

class Scan {
  static async createScanRecord(userId, documentId) {
    return new Promise((resolve, reject) => {
      DB.run(
        "INSERT INTO scan_history (user_id, document_id, scan_date) VALUES (?, ?, CURRENT_TIMESTAMP)",
        [userId, documentId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              userId,
              documentId,
              scanDate: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  static async saveScanResults(scanId, matchedDocId, similarityScore) {
    return new Promise((resolve, reject) => {
      DB.run(
        "INSERT INTO match_results (scan_id, matched_doc_id, similarity_score) VALUES (?, ?, ?)",
        [scanId, matchedDocId, similarityScore],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              scanId,
              matchedDocId,
              similarityScore,
            });
          }
        }
      );
    });
  }

  static async getScanResults(scanId) {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT mr.id, mr.similarity_score, d.id as document_id, d.filename, d.upload_date
         FROM match_results mr
         JOIN documents d ON mr.matched_doc_id = d.id
         WHERE mr.scan_id = ?
         ORDER BY mr.similarity_score DESC`,
        [scanId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  static async getUserScans(userId) {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT 
           sh.id AS scan_id, 
           sh.scan_date, 
           d.id AS document_id, 
           d.filename, 
           mr.matched_doc_id, 
           d2.filename AS matched_filename, 
           mr.similarity_score
         FROM scan_history sh
         JOIN documents d ON sh.document_id = d.id
         LEFT JOIN match_results mr ON sh.id = mr.scan_id
         LEFT JOIN documents d2 ON mr.matched_doc_id = d2.id
         WHERE sh.user_id = ?
         ORDER BY sh.scan_date DESC`,
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }
}

export default Scan;
