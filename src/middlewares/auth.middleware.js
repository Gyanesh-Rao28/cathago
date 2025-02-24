import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(403).json({ message: "Invalid user" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied: Admin rights required" });
  }
  next();
};

export const checkCredits = async (req, res, next) => {
  try {
    if (!req.user || req.user.credits <= 0) {
      return res.status(403).json({
        message:
          "Insufficient credits. Please request more credits or wait for the daily reset.",
        credits: req.user ? req.user.credits : 0,
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Error checking credits" });
  }
};
