// src/app/api/db-test-iam/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    console.log("Testing database connection with IAM auth");

    // Log connection configuration
    console.log({
      isVercel: process.env.VERCEL === "1",
      hasRoleArn: !!process.env.AWS_ROLE_ARN,
      hasRegion: !!process.env.AWS_REGION,
      hasRdsHostname: !!process.env.RDS_HOSTNAME,
      hasRdsUsername: !!process.env.RDS_USERNAME,
      hasRdsDb: !!process.env.RDS_DATABASE,
    });

    // Test the connection
    const result = await db.query(
      "SELECT NOW() as time, current_user as username, current_database() as database"
    );

    console.log("Connection successful:", result.rows[0]);

    return NextResponse.json({
      success: true,
      time: result.rows[0].time,
      username: result.rows[0].username,
      database: result.rows[0].database,
      connectionInfo: {
        usingIam: process.env.VERCEL === "1" && !!process.env.AWS_ROLE_ARN,
        host: process.env.RDS_HOSTNAME || "(Using DATABASE_URL)",
        databaseName: process.env.RDS_DATABASE || "(Using DATABASE_URL)",
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        connectionInfo: {
          usingIam: process.env.VERCEL === "1" && !!process.env.AWS_ROLE_ARN,
          host: process.env.RDS_HOSTNAME || "(Using DATABASE_URL)",
          databaseName: process.env.RDS_DATABASE || "(Using DATABASE_URL)",
        },
      },
      {
        status: 500,
      }
    );
  }
}
