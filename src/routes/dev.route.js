import express from "express";
import DB from "../db.js";

const router = express.Router();

// Development route to make a user admin by username
router.post("/make-admin/:username", (req, res) => {
  const { username } = req.params;

  DB.run(
    'UPDATE users SET role = "admin" WHERE username = ?',
    [username],
    function (err) {
      if (err) {
        console.error("Error making user admin:", err);
        return res.status(500).json({
          message: "Error making user admin",
          error: err.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: `User "${username}" not found`,
        });
      }

      res.status(200).json({
        message: `User "${username}" is now an admin`,
        changes: this.changes,
      });
    }
  );
});

// Get all users (for development purposes)
router.get("/users", (req, res) => {
  DB.all("SELECT id, username, role, credits FROM users", [], (err, users) => {
    if (err) {
      console.error("Error getting users:", err);
      return res.status(500).json({
        message: "Error getting users",
        error: err.message,
      });
    }

    res.status(200).json({
      users,
    });
  });
});

export default router;
