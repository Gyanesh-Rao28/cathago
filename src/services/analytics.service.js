import DB from "../db.js";
import geminiModel from "../configs/gemini.config.js";

class AnalyticsService {
  static async getDocumentTopics(text) {
    try {
      const prompt = `Analyze this text and identify the main topics and themes.
        Return the result as a JSON array with each item having:
        - topic: the main topic or theme
        - confidence: confidence score (0-100)
        - keywords: array of related keywords

        Text: ${text.substring(0, 5000)}`;

      const result = await geminiModel.generateContent(prompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error("Error detecting topics:", error);
      return this.getFallbackTopics(text);
    }
  }

  static getFallbackTopics(text) {
    // Simple word frequency analysis
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const frequency = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({
        topic: word,
        confidence: (count / words.length) * 100,
        keywords: [],
      }));
  }

  static async getScanStatistics(timeframe = "30days") {
    const timeframes = {
      "24hours": "datetime('now', '-1 day')",
      "7days": "datetime('now', '-7 days')",
      "30days": "datetime('now', '-30 days')",
    };

    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT 
          COUNT(*) as total_scans,
          AVG(similarity_score) as avg_similarity,
          MAX(similarity_score) as max_similarity,
          MIN(similarity_score) as min_similarity,
          COUNT(DISTINCT sh.user_id) as unique_users,
          COUNT(DISTINCT sh.document_id) as unique_documents
         FROM scan_history sh
         LEFT JOIN match_results mr ON sh.id = mr.scan_id
         WHERE sh.scan_date >= ${timeframes[timeframe]}`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });
  }

  static async getUserActivityStats(userId) {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT 
          (SELECT COUNT(*) FROM scan_history WHERE user_id = ?) as total_scans,
          (SELECT COUNT(*) FROM documents WHERE user_id = ?) as total_documents,
          (SELECT COUNT(*) FROM credit_requests WHERE user_id = ?) as credit_requests,
          (SELECT credits FROM users WHERE id = ?) as current_credits,
          (SELECT AVG(similarity_score) 
           FROM scan_history sh 
           JOIN match_results mr ON sh.id = mr.scan_id 
           WHERE sh.user_id = ?) as avg_similarity_score`,
        [userId, userId, userId, userId, userId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows[0]);
        }
      );
    });
  }

  static async getSystemUsageTrends() {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT 
          date(scan_date) as date,
          COUNT(*) as scan_count,
          COUNT(DISTINCT user_id) as active_users,
          AVG(similarity_score) as avg_similarity
         FROM scan_history sh
         LEFT JOIN match_results mr ON sh.id = mr.scan_id
         GROUP BY date(scan_date)
         ORDER BY date DESC
         LIMIT 30`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static async getCreditAnalytics() {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT 
          date(request_date) as date,
          COUNT(*) as request_count,
          SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) as credits_approved,
          SUM(CASE WHEN status = 'denied' THEN amount ELSE 0 END) as credits_denied,
          COUNT(DISTINCT user_id) as unique_requesters
         FROM credit_requests
         GROUP BY date(request_date)
         ORDER BY date DESC
         LIMIT 30`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

export default AnalyticsService;
