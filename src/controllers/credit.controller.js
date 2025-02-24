import Credit from "../models/credit.model.js";
import User from "../models/user.model.js";

export const requestCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount = 10 } = req.body;

    // Validate amount
    if (amount <= 0 || amount > 100) {
      return res.status(400).json({
        message:
          "Invalid credit amount. Please request between 1 and 100 credits",
      });
    }

    // Check if user already has a pending request
    const pendingRequests = await Credit.getPendingRequests();
    const userHasPendingRequest = pendingRequests.some(
      (req) => req.user_id === userId
    );

    if (userHasPendingRequest) {
      return res.status(400).json({
        message: "You already have a pending credit request",
      });
    }

    // Create credit request
    const request = await Credit.requestCredits(userId, amount);

    res.status(201).json({
      message: "Credit request submitted successfully",
      request,
    });
  } catch (error) {
    console.error("Error requesting credits:", error);
    res.status(500).json({
      message: "Error submitting credit request",
      error: error.message,
    });
  }
};

export const approveCredit = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    const { requestId } = req.params;

    // Approve the request
    const result = await Credit.approveRequest(requestId);

    res.status(200).json({
      message: "Credit request approved successfully",
      result,
    });
  } catch (error) {
    console.error("Error approving credit request:", error);
    res.status(500).json({
      message: "Error approving credit request",
      error: error.message,
    });
  }
};

export const denyCredit = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    const { requestId } = req.params;

    // Deny the request
    const result = await Credit.denyRequest(requestId);

    res.status(200).json({
      message: "Credit request denied",
      result,
    });
  } catch (error) {
    console.error("Error denying credit request:", error);
    res.status(500).json({
      message: "Error denying credit request",
      error: error.message,
    });
  }
};

export const resetDailyCredits = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    // Reset all users' credits
    const result = await User.resetDailyCredits();

    res.status(200).json({
      message: "Daily credits reset successfully",
      usersAffected: result.affected,
    });
  } catch (error) {
    console.error("Error resetting daily credits:", error);
    res.status(500).json({
      message: "Error resetting daily credits",
      error: error.message,
    });
  }
};

export const getPendingCreditRequests = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied: Admin rights required" });
    }

    // Get all pending requests
    const requests = await Credit.getPendingRequests();

    res.status(200).json({
      message: "Pending credit requests retrieved successfully",
      requests,
    });
  } catch (error) {
    console.error("Error getting pending credit requests:", error);
    res.status(500).json({
      message: "Error retrieving pending credit requests",
      error: error.message,
    });
  }
};
