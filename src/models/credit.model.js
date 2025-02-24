import DB from "../db.js";

class Credit {
  static async deductCredit(userId) {
    return new Promise((resolve, reject) => {
      DB.get("SELECT credits FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) {
          return reject(err);
        }

        if (!row) {
          return reject(new Error("User not found"));
        }

        if (row.credits <= 0) {
          return reject(new Error("Insufficient credits"));
        }

        const newCreditAmount = row.credits - 1;

        DB.run(
          "UPDATE users SET credits = ? WHERE id = ?",
          [newCreditAmount, userId],
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                userId,
                previousCredits: row.credits,
                currentCredits: newCreditAmount,
              });
            }
          }
        );
      });
    });
  }

  static async requestCredits(userId, amount = 10) {
    return new Promise((resolve, reject) => {
      DB.run(
        'INSERT INTO credit_requests (user_id, amount, request_date, status) VALUES (?, ?, CURRENT_TIMESTAMP, "pending")',
        [userId, amount],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              userId,
              amount,
              status: "pending",
              requestDate: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  static async getPendingRequests() {
    return new Promise((resolve, reject) => {
      DB.all(
        `SELECT cr.*, u.username 
         FROM credit_requests cr
         JOIN users u ON cr.user_id = u.id
         WHERE cr.status = "pending"
         ORDER BY cr.request_date ASC`,
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

  static async approveRequest(requestId) {
    return new Promise((resolve, reject) => {
      DB.get(
        "SELECT * FROM credit_requests WHERE id = ?",
        [requestId],
        (err, request) => {
          if (err) {
            return reject(err);
          }

          if (!request) {
            return reject(new Error("Request not found"));
          }

          DB.get(
            "SELECT credits FROM users WHERE id = ?",
            [request.user_id],
            (err, user) => {
              if (err) {
                return reject(err);
              }

              if (!user) {
                return reject(new Error("User not found"));
              }

              const newCreditAmount = user.credits + request.amount;

              // Begin transaction
              DB.run("BEGIN TRANSACTION", (err) => {
                if (err) {
                  return reject(err);
                }

                // Update request status
                DB.run(
                  'UPDATE credit_requests SET status = "approved" WHERE id = ?',
                  [requestId],
                  (err) => {
                    if (err) {
                      DB.run("ROLLBACK");
                      return reject(err);
                    }

                    // Update user credits
                    DB.run(
                      "UPDATE users SET credits = ? WHERE id = ?",
                      [newCreditAmount, request.user_id],
                      (err) => {
                        if (err) {
                          DB.run("ROLLBACK");
                          return reject(err);
                        }

                        // Commit transaction
                        DB.run("COMMIT", (err) => {
                          if (err) {
                            DB.run("ROLLBACK");
                            return reject(err);
                          }

                          resolve({
                            requestId,
                            userId: request.user_id,
                            previousCredits: user.credits,
                            currentCredits: newCreditAmount,
                            amountAdded: request.amount,
                          });
                        });
                      }
                    );
                  }
                );
              });
            }
          );
        }
      );
    });
  }

  static async denyRequest(requestId) {
    return new Promise((resolve, reject) => {
      DB.run(
        'UPDATE credit_requests SET status = "denied" WHERE id = ?',
        [requestId],
        function (err) {
          if (err) {
            reject(err);
          } else {
            if (this.changes === 0) {
              reject(new Error("Request not found"));
            } else {
              resolve({
                requestId,
                status: "denied",
              });
            }
          }
        }
      );
    });
  }
}

export default Credit;
