// src/lib/db.ts
import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

let pool: Pool;

if (process.env.NODE_ENV === "production") {
  // OIDC Authentication for production environments
  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
    }),
    region: process.env.AWS_REGION!,
    port: parseInt(process.env.RDS_PORT || "5432"),
    hostname: process.env.RDS_HOSTNAME!,
    username: process.env.RDS_USERNAME!,
  });

  pool = new Pool({
    user: process.env.RDS_USERNAME,
    host: process.env.RDS_HOSTNAME,
    database: process.env.RDS_DATABASE,
    password: signer.getAuthToken,
    port: parseInt(process.env.RDS_PORT || "5432"),
    ssl: {
      rejectUnauthorized: false, // Required for AWS RDS if SSL is enabled
    },
  });
} else {
  // Standard connection string for development
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export default pool;
