import ActivityLog from "../models/activityLog.model.js";
import AnalyticsService from "../services/analytics.service.js";

export const getUserActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const activities = await ActivityLog.getUserActivities(userId);

    res.status(200).json({
      message: "User activities retrieved successfully",
      activities,
    });
  } catch (error) {
    console.error("Error retrieving user activities:", error);
    res.status(500).json({
      message: "Error retrieving user activities",
      error: error.message,
    });
  }
};

export const getSystemActivities = async (req, res) => {
  try {
    const filters = {
      actionType: req.query.actionType,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const activities = await ActivityLog.getSystemActivities(filters);

    res.status(200).json({
      message: "System activities retrieved successfully",
      activities,
    });
  } catch (error) {
    console.error("Error retrieving system activities:", error);
    res.status(500).json({
      message: "Error retrieving system activities",
      error: error.message,
    });
  }
};

export const getEnhancedAnalytics = async (req, res) => {
  try {
    const [scanStats, usageTrends, creditAnalytics] = await Promise.all([
      AnalyticsService.getScanStatistics(req.query.timeframe),
      AnalyticsService.getSystemUsageTrends(),
      AnalyticsService.getCreditAnalytics(),
    ]);

    res.status(200).json({
      message: "Enhanced analytics retrieved successfully",
      analytics: {
        scanStats,
        usageTrends,
        creditAnalytics,
      },
    });
  } catch (error) {
    console.error("Error retrieving enhanced analytics:", error);
    res.status(500).json({
      message: "Error retrieving enhanced analytics",
      error: error.message,
    });
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const stats = await AnalyticsService.getUserActivityStats(userId);

    res.status(200).json({
      message: "User analytics retrieved successfully",
      stats,
    });
  } catch (error) {
    console.error("Error retrieving user analytics:", error);
    res.status(500).json({
      message: "Error retrieving user analytics",
      error: error.message,
    });
  }
};
