// src/lib/db.ts
import { Pool } from "pg";
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
    console.log("Configuring RDS IAM auth connection");

    try {
      // Make sure all required values exist
      const roleArn = process.env.AWS_ROLE_ARN;
      const region = process.env.AWS_REGION || "us-east-1";
      const hostname = process.env.RDS_HOSTNAME;
      const username = process.env.RDS_USERNAME;
      const database = process.env.RDS_DATABASE;

      if (!roleArn || !hostname || !username || !database) {
        throw new Error(
          "Missing required environment variables for IAM authentication"
        );
      }

      // Create RDS signer with non-null values
      const signer = new Signer({
        credentials: awsCredentialsProvider({
          roleArn: roleArn,
        }),
        region: region,
        hostname: hostname,
        port: parseInt(process.env.RDS_PORT || "5432"),
        username: username,
      });

      // Create pool with IAM auth
      return new Pool({
        user: username,
        password: () => signer.getAuthToken(),
        host: hostname,
        database: database,
        port: parseInt(process.env.RDS_PORT || "5432"),
        ssl: { rejectUnauthorized: false },
      });
    } catch (error) {
      console.error("Error setting up IAM authentication:", error);
      throw error;
    }
  } else {
    console.log("Using standard connection string");

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    return new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
}

// Create database object with async query method
const db = {
  query: async (text: string, params?: unknown[]) => {
    if (!pool) {
      console.log("Initializing database pool");
      pool = await createPool();
    }
    return pool.query(text, params);
  },
};

export default db;
