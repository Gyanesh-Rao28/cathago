import DB from "../db.js";

class Admin {
  // Get overall system statistics
  static async getSystemStats() {
    return new Promise((resolve, reject) => {
      const stats = {};

      // Get total users count
      DB.get(
        "SELECT COUNT(*) as totalUsers FROM users",
        [],
        (err, userCount) => {
          if (err) return reject(err);
          stats.totalUsers = userCount.totalUsers;

          // Get total documents count
          DB.get(
            "SELECT COUNT(*) as totalDocuments FROM documents",
            [],
            (err, docCount) => {
              if (err) return reject(err);
              stats.totalDocuments = docCount.totalDocuments;

              // Get total scans count
              DB.get(
                "SELECT COUNT(*) as totalScans FROM scan_history",
                [],
                (err, scanCount) => {
                  if (err) return reject(err);
                  stats.totalScans = scanCount.totalScans;

                  // Get average similarity score
                  DB.get(
                    "SELECT AVG(similarity_score) as avgSimilarityScore FROM match_results",
                    [],
                    (err, avgScore) => {
                      if (err) return reject(err);
                      stats.avgSimilarityScore =
                        avgScore.avgSimilarityScore || 0;

                      // Get today's activity
                      const today = new Date().toISOString().split("T")[0];
                      DB.get(
                        `SELECT COUNT(*) as todayScans FROM scan_history 
                 WHERE date(scan_date) = ?`,
                        [today],
                        (err, todayCount) => {
                          if (err) return reject(err);
                          stats.todayScans = todayCount.todayScans;

                          // Get total credits requested
                          DB.get(
                            "SELECT SUM(amount) as totalCreditsRequested FROM credit_requests",
                            [],
                            (err, creditsRequested) => {
                              if (err) return reject(err);
                              stats.totalCreditsRequested =
                                creditsRequested.totalCreditsRequested || 0;

                              // Get pending credits count
                              DB.get(
                                'SELECT COUNT(*) as pendingRequests FROM credit_requests WHERE status = "pending"',
                                [],
                                (err, pendingCount) => {
                                  if (err) return reject(err);
                                  stats.pendingRequests =
                                    pendingCount.pendingRequests;

                                  resolve(stats);
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }

  // Get top users by scan count
  static async getTopUsersByScanCount(limit = 10) {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT u.id, u.username, COUNT(sh.id) as scanCount 
         FROM users u
         LEFT JOIN scan_history sh ON u.id = sh.user_id
         GROUP BY u.id
         ORDER BY scanCount DESC
         LIMIT ?`,
        [limit],
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

  // Get top users by credit usage
  static async getTopUsersByCreditUsage(limit = 10) {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT u.id, u.username, 
         (SELECT COUNT(*) FROM scan_history sh WHERE sh.user_id = u.id) as creditsUsed,
         u.credits as currentCredits
         FROM users u
         ORDER BY creditsUsed DESC
         LIMIT ?`,
        [limit],
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

  // Get daily scan activity for the last 30 days
  static async getDailyScanActivity(days = 30) {
    return new Promise((resolve, reject) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = startDate.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      DB.all(
        `SELECT date(scan_date) as date, COUNT(*) as scanCount
         FROM scan_history
         WHERE date(scan_date) BETWEEN ? AND ?
         GROUP BY date(scan_date)
         ORDER BY date(scan_date) ASC`,
        [startDateStr, endDateStr],
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

  // Get document topics based on content analysis
  static async getDocumentTopics() {
    return new Promise((resolve, reject) => {
      // This is a simplified implementation
      // In a real-world scenario, you'd use NLP or AI to extract topics

      // Get common words across documents excluding stop words
      DB.all(`SELECT id, content FROM documents`, [], (err, documents) => {
        if (err) {
          reject(err);
        } else {
          try {
            // Simple word frequency analysis
            const wordFrequency = {};
            const stopWords = [
              "the",
              "and",
              "a",
              "an",
              "in",
              "on",
              "at",
              "to",
              "for",
              "of",
              "with",
              "by",
            ];

            documents.forEach((doc) => {
              if (!doc.content) return;

              const words = doc.content
                .toLowerCase()
                .replace(/[^\w\s]/g, "")
                .split(/\s+/)
                .filter((word) => word.length > 3 && !stopWords.includes(word));

              words.forEach((word) => {
                if (wordFrequency[word]) {
                  wordFrequency[word]++;
                } else {
                  wordFrequency[word] = 1;
                }
              });
            });

            // Convert to array and sort by frequency
            const topics = Object.entries(wordFrequency)
              .map(([word, count]) => ({ word, count }))
              .filter((topic) => topic.count > 1)
              .sort((a, b) => b.count - a.count)
              .slice(0, 20);

            resolve(topics);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  // Get user activity logs
  static async getUserActivityLogs(limit = 100) {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT u.username, 'scan' as activity_type, sh.scan_date as timestamp,
         d.filename as details
         FROM scan_history sh
         JOIN users u ON sh.user_id = u.id
         JOIN documents d ON sh.document_id = d.id
         UNION ALL
         SELECT u.username, 'credit_request' as activity_type, cr.request_date as timestamp,
         ('Amount: ' || cr.amount || ', Status: ' || cr.status) as details
         FROM credit_requests cr
         JOIN users u ON cr.user_id = u.id
         ORDER BY timestamp DESC
         LIMIT ?`,
        [limit],
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

  // Get credit usage statistics
  static async getCreditUsageStats() {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT 
         SUM(CASE WHEN u.role = 'user' THEN u.credits ELSE 0 END) as totalUserCredits,
         SUM(CASE WHEN u.role = 'admin' THEN u.credits ELSE 0 END) as totalAdminCredits,
         (SELECT COUNT(*) FROM scan_history) as totalCreditsUsed,
         (SELECT SUM(amount) FROM credit_requests WHERE status = 'approved') as totalCreditsApproved,
         (SELECT SUM(amount) FROM credit_requests WHERE status = 'denied') as totalCreditsDenied,
         (SELECT SUM(amount) FROM credit_requests WHERE status = 'pending') as totalCreditsPending
         FROM users u`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const stats = rows[0] || {};

            // Calculate additional metrics
            stats.averageCreditsPerUser =
              stats.totalUserCredits /
              DB.get(
                'SELECT COUNT(*) as count FROM users WHERE role = "user"',
                (err, row) => {
                  return row ? row.count : 1;
                }
              );

            resolve(stats);
          }
        }
      );
    });
  }
}

export default Admin;
