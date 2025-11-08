import pkg from "pg";
const { Pool } = pkg;

// Supabase PostgreSQL connection pool
// Use connection pooling URL from Supabase dashboard (Settings -> Database -> Connection Pooling)
// Format: postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
// 
// Note: Supabase requires SSL for connection pooling. Set SSL mode in connection string:
// Add ?sslmode=require to your connection string, or configure it below
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

const pool = new Pool({
  connectionString: connectionString,
  // Supabase requires SSL for connection pooling
  ssl: connectionString && connectionString.includes('supabase.co')
    ? { rejectUnauthorized: false } // Required for Supabase
    : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
});

// Test connection function
export const testConnection = async () => {
  // Check if connection string is configured
  if (!connectionString) {
    return {
      success: false,
      message: "Database connection string not configured",
      error: "DATABASE_URL or SUPABASE_DB_URL environment variable is not set",
      hint: "Add DATABASE_URL or SUPABASE_DB_URL to your .env file"
    };
  }

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version, current_database() as database_name');
    client.release();
    return {
      success: true,
      message: "Database connection successful",
      data: {
        currentTime: result.rows[0].current_time,
        postgresVersion: result.rows[0].postgres_version.split(',')[0],
        databaseName: result.rows[0].database_name,
      }
    };
  } catch (error) {
    let helpfulMessage = error.message;
    
    // Provide helpful error messages
    if (error.message.includes('password authentication failed')) {
      helpfulMessage = "Authentication failed - check your database password";
    } else if (error.message.includes('timeout')) {
      helpfulMessage = "Connection timeout - check your connection string and network";
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      helpfulMessage = "Cannot resolve hostname - check your connection string URL";
    } else if (error.message.includes('SSL')) {
      helpfulMessage = "SSL connection error - Supabase requires SSL";
    }

    return {
      success: false,
      message: "Database connection failed",
      error: helpfulMessage,
      originalError: error.message,
      hint: "Verify your DATABASE_URL or SUPABASE_DB_URL in .env file"
    };
  }
};

export default pool;
