import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";
import pool from "../config/db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
// Note: Removed debug/test routes in production trimmed version
app.use("/api", router);

const PORT = process.env.PORT || 5000;

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Test database connection on startup
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown handlers
const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  try {
    if (pool && typeof pool.end === "function") {
      await pool.end();
      console.log("Database pool closed.");
    }
  } catch (err) {
    console.error("Error during pool shutdown:", err?.message || err);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection at:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
