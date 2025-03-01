// src/lib/db.ts
import { Pool, PoolConfig } from "pg";

let pool: Pool;

async function createPool() {
  // Check if Supabase connection details are provided
  const useSupabase = process.env.SUPABASE_CONNECTION_STRING || 
    (process.env.SUPABASE_HOST && process.env.SUPABASE_PASSWORD);

  console.log(
    "Database connection mode:",
    useSupabase ? "Supabase" : "Standard PostgreSQL"
  );

  if (useSupabase) {
    // Enhanced logging for Supabase configuration
    console.log("Configuring Supabase connection");

    try {
      // If full connection string is provided
      if (process.env.SUPABASE_CONNECTION_STRING) {
        console.log("Using Supabase connection string");
        
        return new Pool({
          connectionString: process.env.SUPABASE_CONNECTION_STRING,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
          max: 5,
          idleTimeoutMillis: 30000,
        });
      }
      
      // Otherwise use individual connection parameters
      const host = process.env.SUPABASE_HOST;
      const port = parseInt(process.env.SUPABASE_PORT || "5432");
      const database = process.env.SUPABASE_DATABASE || "postgres";
      const user = process.env.SUPABASE_USER || "postgres";
      const password = process.env.SUPABASE_PASSWORD;

      if (!host || !password) {
        throw new Error(
          "Missing required environment variables for Supabase connection"
        );
      }

      // Configure pool with direct Supabase parameters
      const config: PoolConfig = {
        host,
        port,
        database,
        user,
        password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        max: 5,
        idleTimeoutMillis: 30000,
      };

      console.log("Creating database pool with Supabase config");
      return new Pool(config);
    } catch (error) {
      console.error("Error in Supabase connection setup:", error);
      throw error;
    }
  } else {
    // Fallback to standard connection with DATABASE_URL
    console.log("Using standard connection string");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    console.log("Creating database pool with standard config");
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
}

// Create database object with enhanced error handling and retry logic
const db = {
  query: async (text: string, params?: unknown[]) => {
    if (!pool) {
      console.log("Initializing database pool");
      pool = await createPool();
    }

    try {
      const start = Date.now();
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      
      // Log query performance for slow queries
      if (duration > 200) {
        console.log('Slow query:', { text, duration, rows: result.rowCount });
      }
      
      return result;
    } catch (error) {
      // Enhanced error logging
      console.error("Database query error:", error);
      console.error("Query:", text);
      console.error("Parameters:", params);
      
      // Check if it's a connection error and retry once
      if (error instanceof Error && 
          (error.message.includes('authentication') || 
           error.message.includes('connect ETIMEDOUT') ||
           error.message.includes('connection'))) {
        console.log("Connection issue detected, recreating pool");
        pool.end(); // End the current pool
        pool = await createPool(); // Create a new pool
        
        // Retry the query once
        console.log("Retrying query after pool recreation");
        return pool.query(text, params);
      }
      
      throw error;
    }
  }
};

export default db;