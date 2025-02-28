// src/app/api/db-test/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    console.log("Testing database connection...");
    console.log("Environment details:", {
      isVercel: process.env.VERCEL === "1",
      hasRoleArn: Boolean(process.env.AWS_ROLE_ARN),
      region: process.env.AWS_REGION || "(not set)",
      hasRdsHostname: Boolean(process.env.RDS_HOSTNAME),
      hasRdsUsername: Boolean(process.env.RDS_USERNAME),
      hasRdsDb: Boolean(process.env.RDS_DATABASE),
      hasDbUrl: Boolean(process.env.DATABASE_URL),
    });

    // Try a simple query
    const result = await db.query(
      "SELECT NOW() as time, current_user as username, current_database() as database"
    );

    console.log("Database query successful:", result.rows[0]);

    // Return detailed information about the connection
    return NextResponse.json({
      success: true,
      time: result.rows[0].time,
      username: result.rows[0].username,
      database: result.rows[0].database,
      connectionInfo: {
        usingIam: process.env.VERCEL === "1" && Boolean(process.env.AWS_ROLE_ARN),
        host: process.env.RDS_HOSTNAME || "(Using DATABASE_URL)",
        databaseName: process.env.RDS_DATABASE || "(Using DATABASE_URL)",
        region: process.env.AWS_REGION || "(default)",
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);

    // Return detailed error information
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        connectionInfo: {
          usingIam: process.env.VERCEL === "1" && Boolean(process.env.AWS_ROLE_ARN),
          host: process.env.RDS_HOSTNAME || "(Using DATABASE_URL)",
          databaseName: process.env.RDS_DATABASE || "(Using DATABASE_URL)",
          region: process.env.AWS_REGION || "(default)",
        },
      },
      { status: 500 }
    );
  }
}