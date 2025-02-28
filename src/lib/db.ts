// src/lib/db.ts
import { Pool, PoolConfig } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

let pool: Pool;

async function createPool() {
  // Check if running on Vercel with IAM auth config
  const useIamAuth =
    process.env.VERCEL === "1" &&
    process.env.AWS_ROLE_ARN &&
    process.env.RDS_HOSTNAME &&
    process.env.RDS_USERNAME;

  console.log(
    "Database connection mode:",
    useIamAuth ? "IAM Authentication" : "Standard"
  );

  if (useIamAuth) {
    // Enhanced logging for IAM configuration
    console.log("Configuring RDS IAM authentication connection");
    console.log("Environment check:", {
      roleArn: Boolean(process.env.AWS_ROLE_ARN),
      region: process.env.AWS_REGION || "us-east-1",
      hostname: Boolean(process.env.RDS_HOSTNAME),
      username: Boolean(process.env.RDS_USERNAME),
      database: Boolean(process.env.RDS_DATABASE),
      port: process.env.RDS_PORT || "5432",
    });

    try {
      // Ensure required values exist
      const roleArn = process.env.AWS_ROLE_ARN;
      const region = process.env.AWS_REGION || "us-east-1";
      const hostname = process.env.RDS_HOSTNAME;
      const username = process.env.RDS_USERNAME;
      const database = process.env.RDS_DATABASE;
      const port = parseInt(process.env.RDS_PORT || "5432");

      if (!roleArn || !hostname || !username || !database) {
        throw new Error(
          "Missing required environment variables for IAM authentication"
        );
      }

      console.log("Creating credential provider with role:", roleArn);
      const credentials = awsCredentialsProvider({
        roleArn,
      });

      // Create token generator function
      const getToken = async () => {
        try {
          console.log("Requesting IAM auth token...");
          const signer = new Signer({
            credentials,
            region,
            hostname,
            port,
            username,
          });
          
          const token = await signer.getAuthToken();
          console.log("Successfully obtained IAM auth token");
          return token;
        } catch (error) {
          console.error("Error obtaining IAM auth token:", error);
          throw error;
        }
      };

      // Configure pool with IAM authentication
      const config: PoolConfig = {
        host: hostname,
        port,
        database,
        user: username,
        ssl: { rejectUnauthorized: false },
        password: getToken,
        // Add connection timeout and retry options
        connectionTimeoutMillis: 10000,
        max: 5, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      };

      console.log("Creating database pool with IAM auth config");
      return new Pool(config);
    } catch (error) {
      console.error("Error in IAM auth setup:", error);
      throw error;
    }
  } else {
    // Standard connection with DATABASE_URL
    console.log("Using standard connection string");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    console.log("Creating database pool with standard config");
    return new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      // Add connection timeout and retry options
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
      
      // Check if it's a connection error that might be related to IAM token
      if (error instanceof Error && 
          (error.message.includes('authentication') || 
           error.message.includes('connect ETIMEDOUT') ||
           error.message.includes('connection'))) {
        console.log("Possible IAM authentication issue, recreating pool");
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