import DB from "../db.js";

class ActivityLog {
  static async create(data) {
    const {
      userId,
      actionType,
      details,
      status = "success",
      metadata = {},
    } = data;

    return new Promise((resolve, reject) => {
      DB.run(
        `INSERT INTO activity_logs (
          user_id, action_type, details, status, metadata, timestamp
        ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, actionType, details, status, JSON.stringify(metadata)],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              userId,
              actionType,
              details,
              status,
              metadata,
              timestamp: new Date(),
            });
          }
        }
      );
    });
  }

  static async getUserActivities(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT * FROM activity_logs 
         WHERE user_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(
              rows.map((row) => ({
                ...row,
                metadata: JSON.parse(row.metadata),
              }))
            );
          }
        }
      );
    });
  }

  static async getSystemActivities(filters = {}, limit = 100) {
    const conditions = [];
    const params = [];

    if (filters.actionType) {
      conditions.push("action_type = ?");
      params.push(filters.actionType);
    }

    if (filters.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    if (filters.startDate) {
      conditions.push("timestamp >= ?");
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push("timestamp <= ?");
      params.push(filters.endDate);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    params.push(limit);

    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT al.*, u.username 
         FROM activity_logs al
         JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY timestamp DESC
         LIMIT ?`,
        params,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(
              rows.map((row) => ({
                ...row,
                metadata: JSON.parse(row.metadata),
              }))
            );
          }
        }
      );
    });
  }
}

export default ActivityLog;
