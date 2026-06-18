// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const fs = require("fs");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3001;

// Ensure screenshots dir exists
const screenshotsDir = process.env.SCREENSHOTS_DIR || "./screenshots";
fs.mkdirSync(screenshotsDir, { recursive: true });

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  credentials: true
}));
app.use(express.json({ limit: "10mb" })); // large for base64 screenshots

// Rate limiting
const limiter = rateLimit({ windowMs: 60 * 1000, max: 200, validate: { xForwardedForHeader: false } });
app.use("/api/", limiter);

// Agent endpoints get a more lenient limit (many machines)
const agentLimiter = rateLimit({ windowMs: 60 * 1000, max: 2000, validate: { xForwardedForHeader: false } });
app.use("/api/agent/", agentLimiter);

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/agent", require("./routes/agent"));
app.use("/api/organisations", require("./routes/organisations"));
app.use("/api/machines", require("./routes/machines"));
app.use("/api/activity", require("./routes/activity"));
app.use("/api/users", require("./routes/users"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 StaffWatch API running on port ${PORT}`);

  // Start nightly screenshot cleanup scheduler
  const { scheduleDailyCleanup } = require("./cleanup");
  scheduleDailyCleanup();
});
