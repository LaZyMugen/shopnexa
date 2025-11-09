import pkg from "pg";
const { Pool } = pkg;

const connectionString =
  process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error("❌ No DATABASE_URL found in .env file");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    require: true,
    rejectUnauthorized: false, // Supabase requires this
  },
  max: 15, // stable default for Supabase Nano
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // give Supabase enough time to respond
});

// Optional diagnostic logs
pool.on("connect", () => console.log("✅ Connected to Supabase Postgres"));
pool.on("error", (err) => console.error("❌ Database error:", err.message));

export const testConnection = async () => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS current_time, version() AS postgres_version, current_database() AS database_name"
    );
    return {
      success: true,
      message: "Database connection successful",
      data: {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].postgres_version.split(",")[0],
        databaseName: result.rows[0].database_name,
      },
    };
  } catch (error) {
    let helpfulMessage = error.message;
    if (error.message.includes("password authentication failed")) {
      helpfulMessage = "Authentication failed - check your database password";
    } else if (error.message.includes("timeout")) {
      helpfulMessage = "Connection timeout - check your connection string and network";
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      helpfulMessage = "Cannot resolve hostname - check your Supabase project URL";
    } else if (error.message.includes("SSL")) {
      helpfulMessage = "SSL connection error - Supabase requires SSL (set rejectUnauthorized:false)";
    }

    return {
      success: false,
      message: "Database connection failed",
      error: helpfulMessage,
      hint: "Verify your DATABASE_URL and ensure network access to port 5432",
    };
  }
};

export default pool;
