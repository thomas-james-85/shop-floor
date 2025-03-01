import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    console.log("Testing Supabase database connection...");
    console.log("Environment details:", {
      hasSupabaseConnString: Boolean(process.env.SUPABASE_CONNECTION_STRING),
      hasSupabaseHost: Boolean(process.env.SUPABASE_HOST),
      hasSupabasePassword: Boolean(process.env.SUPABASE_PASSWORD),
    });

    // Try a simple query
    const result = await db.query(
      "SELECT NOW() as time, current_user as username, current_database() as database"
    );

    console.log("Database query successful:", result.rows[0]);

    // List all tables to verify schema access
    const tablesResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    // Return detailed information about the connection
    return NextResponse.json({
      success: true,
      connection: {
        time: result.rows[0].time,
        username: result.rows[0].username,
        database: result.rows[0].database,
      },
      schema: {
        tableCount: tablesResult.rowCount,
        tables: tablesResult.rows.map(row => row.table_name)
      },
      connectionInfo: {
        usingSupabase: Boolean(process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_HOST),
        host: process.env.SUPABASE_HOST || "(Using CONNECTION_STRING)",
        databaseName: process.env.SUPABASE_DATABASE || "postgres",
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
          usingSupabase: Boolean(process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_HOST),
          host: process.env.SUPABASE_HOST || "(Using CONNECTION_STRING)",
          databaseName: process.env.SUPABASE_DATABASE || "postgres",
        },
      },
      { status: 500 }
    );
  }
}  