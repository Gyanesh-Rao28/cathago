import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import session from "express-session";

import "./db.js";
import { scheduleCreditReset } from "./utils/creditScheduler.js";


// Import routes
import userRoutes from "./routes/user.route.js";
import scanRoutes from "./routes/scan.route.js";
import creditRoutes from "./routes/credit.route.js";
import adminRoutes from "./routes/admin.route.js";
import activityRoutes from "./routes/activity.route.js";
import devRoutes from "./routes/dev.route.js";

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));
scheduleCreditReset();

// Session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET || "JWT_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);  

// Routes
app.use("/api/auth", userRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activities", activityRoutes);
app.use("/dev", devRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Hello")
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
