import DB from "../db.js";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";


export const getAnalyticsDashboard = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    // Get system statistics
    const systemStats = await Admin.getSystemStats();

    // Get top users by scan count
    const topUsersByScan = await Admin.getTopUsersByScanCount(5);

    // Get top users by credit usage
    const topUsersByCredit = await Admin.getTopUsersByCreditUsage(5);

    // Get daily scan activity
    const dailyScanActivity = await Admin.getDailyScanActivity(14); // Last 14 days

    // Get document topics
    const documentTopics = await Admin.getDocumentTopics();

    // Assemble dashboard data
    const dashboardData = {
      systemStats,
      topUsersByScan,
      topUsersByCredit,
      dailyScanActivity,
      documentTopics,
    };

    res.status(200).json({
      message: "Analytics dashboard data retrieved successfully",
      dashboard: dashboardData,
    });
  } catch (error) {
    console.error("Error retrieving analytics dashboard:", error);
    res.status(500).json({
      message: "Error retrieving analytics dashboard",
      error: error.message,
    });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    // Get user activity logs
    const activityLogs = await Admin.getUserActivityLogs(limit);

    res.status(200).json({
      message: "User activity logs retrieved successfully",
      logs: activityLogs,
    });
  } catch (error) {
    console.error("Error retrieving user activity logs:", error);
    res.status(500).json({
      message: "Error retrieving user activity logs",
      error: error.message,
    });
  }
};

export const getCreditStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    // Get credit usage statistics
    const creditStats = await Admin.getCreditUsageStats();

    res.status(200).json({
      message: "Credit usage statistics retrieved successfully",
      stats: creditStats,
    });
  } catch (error) {
    console.error("Error retrieving credit usage statistics:", error);
    res.status(500).json({
      message: "Error retrieving credit usage statistics",
      error: error.message,
    });
  }
};


export const resetUserCredits = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    const { userId } = req.params;

    // Validate userId (should be a number)
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid userId provided" });
    }
    // Call model function
    const result = await Admin.resetUserCredit(userId);

    if (result.changes === 0) {
      return res
        .status(404)
        .json({ message: "User not found or no update made" });
    }

    res.status(200).json({
      message: "User credits reset successfully",
      userId,
    });
  } catch (error) {
    console.error("Error resetting user credits:", error);
    res.status(500).json({
      message: "Error resetting user credits",
      error: error.message,
    });
  }
};



export const deleteUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        message: "Cannot delete your own admin account",
      });
    }

    // Delete user and all related data
    await User.deleteUser(userId);

    res.status(200).json({
      message: "User and all related data deleted successfully",
      deletedUserId: userId,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};

export const promoteUserToAdmin = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    const { userId } = req.params;

    // Prevent promoting same user
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        message: "You are already an admin",
      });
    }

    // Promote user to admin
    const result = await User.promoteToAdmin(userId);

    res.status(200).json({
      message: "User promoted to admin successfully",
      user: result,
    });
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    res.status(error.message === "User not found" ? 404 : 500).json({
      message: "Error promoting user to admin",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    // Fetch all users with document counts
    const query = `
      SELECT u.id, u.username, u.role, u.credits, 
             COUNT(DISTINCT d.id) as documentCount
      FROM users u
      LEFT JOIN documents d ON u.id = d.user_id
      GROUP BY u.id
      ORDER BY u.username
    `;

    const users = await new Promise((resolve, reject) => {
      DB.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.status(200).json({
      message: "Users retrieved successfully",
      users: users || [],
    });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({
      message: "Error retrieving users",
      error: error.message,
    });
  }
};

export const getRequestHistory = async (req, res) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    // Query to fetch request history from the credit_requests table
    const query = `
      SELECT 
        cr.id AS request_id,
        u.id AS user_id,
        u.username,
        cr.amount,
        cr.status,
        cr.request_date
      FROM credit_requests cr
      JOIN users u ON cr.user_id = u.id
      ORDER BY cr.request_date DESC
    `;

    const requestHistory = await new Promise((resolve, reject) => {
      DB.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.status(200).json({
      message: "Credit request history retrieved successfully",
      history: requestHistory || [],
    });
  } catch (error) {
    console.error("Error retrieving request history:", error);
    res.status(500).json({
      message: "Error retrieving request history",
      error: error.message,
    });
  }
};