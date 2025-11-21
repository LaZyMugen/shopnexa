import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";
import pool from "../config/db.js";
import bus from "./events/eventBus.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
// Note: Removed debug/test routes in production trimmed version
app.use("/api", router);

// Simple Server-Sent Events endpoint for realtime updates
const sseClients = new Set();
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
  res.write(`event: ping\ndata: {"ts": ${Date.now()}}\n\n`);
  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
  });
});

function broadcast(event, payload) {
  const data = JSON.stringify(payload);
  for (const client of sseClients) {
    client.write(`event: ${event}\ndata: ${data}\n\n`);
  }
}

bus.on('order-status', (p) => broadcast('order-status', p));
bus.on('delivery-confirmed', (p) => broadcast('delivery-confirmed', p));
bus.on('feedback-new', (p) => broadcast('feedback-new', p));
bus.on('shipper-message', (p) => broadcast('shipper-message', p));

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
