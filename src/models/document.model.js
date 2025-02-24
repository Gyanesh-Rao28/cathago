import DB from "../db.js";

class Document {
  static async create(userId, filename, content) {
    return new Promise((resolve, reject) => {
      DB.run(
        "INSERT INTO documents (user_id, filename, content, upload_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
        [userId, filename, content],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              userId,
              filename,
              uploadDate: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      DB.get("SELECT * FROM documents WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      DB.all(
        "SELECT * FROM documents WHERE user_id = ? ORDER BY upload_date DESC",
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

  static async getAllDocuments() {
    return new Promise((resolve, reject) => {
      DB.all(
        "SELECT * FROM documents ORDER BY upload_date DESC",
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

export default Document;
