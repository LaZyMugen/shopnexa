import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index.js";
import testRoute from "./routes/testSupabase.js";
import { testConnection } from "../config/db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Database connection test endpoint
app.get("/api/test/db", async (req, res) => {
  try {
    const result = await testConnection();
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message
    });
  }
});

app.use("/api", router);
app.use("/api/test", testRoute);

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
  console.log(` Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` DB test: http://localhost:${PORT}/api/test/db`);
  
  // Test database connection on startup
  console.log("\n🔍 Testing database connection...");
  const dbTest = await testConnection();
  if (dbTest.success) {
    console.log("✅ Database connection: SUCCESS");
    console.log(`   Current time: ${dbTest.data.currentTime}`);
    console.log(`   PostgreSQL: ${dbTest.data.postgresVersion}`);
  } else {
    console.log("❌ Database connection: FAILED");
    console.log(`   Error: ${dbTest.error}`);
    console.log("   ⚠️  Make sure DATABASE_URL or SUPABASE_DB_URL is set in .env");
  }
});
