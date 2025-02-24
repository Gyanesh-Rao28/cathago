import DB from "../db.js";
import bcrypt from "bcrypt";

class User {
  static async findByUsername(username) {
    return new Promise((resolve, reject) => {
      DB.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      DB.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  static async create(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return new Promise((resolve, reject) => {
      DB.run(
        "INSERT INTO users (username, password, credits, last_reset) VALUES (?, ?, 20, CURRENT_TIMESTAMP)",
        [username, hashedPassword],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              username,
              credits: 20,
              role: "user",
            });
          }
        }
      );
    });
  }

  static async updateCredits(userId, newCreditAmount) {
    return new Promise((resolve, reject) => {
      DB.run(
        "UPDATE users SET credits = ? WHERE id = ?",
        [newCreditAmount, userId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ affected: this.changes });
          }
        }
      );
    });
  }

  static async resetDailyCredits() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    return new Promise((resolve, reject) => {
      DB.run(
        `UPDATE users SET credits = 20, last_reset = CURRENT_TIMESTAMP 
         WHERE DATE(last_reset) <= ?`,
        [yesterdayStr],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ affected: this.changes });
          }
        }
      );
    });
  }

  static async getUserProfile(userId) {
    return new Promise((resolve, reject) => {
      DB.get(
        `SELECT id, username, role, credits, last_reset FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
          if (err) {
            reject(err);
          } else if (!user) {
            reject(new Error("User not found"));
          } else {
            // Get scan history
            DB.all(
              `SELECT sh.id, sh.scan_date, d.filename 
               FROM scan_history sh
               JOIN documents d ON sh.document_id = d.id
               WHERE sh.user_id = ?
               ORDER BY sh.scan_date DESC LIMIT 10`,
              [userId],
              (err, scans) => {
                if (err) {
                  reject(err);
                } else {
                  // Get credit requests
                  DB.all(
                    `SELECT id, request_date, status, amount 
                     FROM credit_requests 
                     WHERE user_id = ?
                     ORDER BY request_date DESC LIMIT 10`,
                    [userId],
                    (err, requests) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve({
                          ...user,
                          scans: scans || [],
                          creditRequests: requests || [],
                        });
                      }
                    }
                  );
                }
              }
            );
          }
        }
      );
    });
  }

  static async deleteUser(userId) {
    return new Promise((resolve, reject) => {
      // Begin transaction
      DB.run('BEGIN TRANSACTION', err => {
        if (err) return reject(err);

        // Delete related records first
        DB.run('DELETE FROM credit_requests WHERE user_id = ?', [userId], err => {
          if (err) {
            DB.run('ROLLBACK');
            return reject(err);
          }

          DB.run('DELETE FROM match_results WHERE scan_id IN (SELECT id FROM scan_history WHERE user_id = ?)', [userId], err => {
            if (err) {
              DB.run('ROLLBACK');
              return reject(err);
            }

            DB.run('DELETE FROM scan_history WHERE user_id = ?', [userId], err => {
              if (err) {
                DB.run('ROLLBACK');
                return reject(err);
              }

              DB.run('DELETE FROM documents WHERE user_id = ?', [userId], err => {
                if (err) {
                  DB.run('ROLLBACK');
                  return reject(err);
                }

                // Finally, delete the user
                DB.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
                  if (err) {
                    DB.run('ROLLBACK');
                    return reject(err);
                  }

                  if (this.changes === 0) {
                    DB.run('ROLLBACK');
                    return reject(new Error('User not found'));
                  }

                  // Commit transaction
                  DB.run('COMMIT', err => {
                    if (err) {
                      DB.run('ROLLBACK');
                      return reject(err);
                    }
                    resolve({ 
                      success: true, 
                      message: 'User and all related data deleted successfully' 
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  static async promoteToAdmin(userId) {
    return new Promise((resolve, reject) => {
      // First check if user exists and is not already an admin
      DB.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
          return reject(err);
        }

        if (!user) {
          return reject(new Error('User not found'));
        }

        if (user.role === 'admin') {
          return reject(new Error('User is already an admin'));
        }

        // Update user role to admin
        DB.run(
          'UPDATE users SET role = "admin" WHERE id = ?',
          [userId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                success: true,
                userId: userId,
                username: user.username,
                newRole: 'admin'
              });
            }
          }
        );
      });
    });
  }
}
  


export default User;
