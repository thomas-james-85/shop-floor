import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query("SELECT NOW();");
    return NextResponse.json({ success: true, timestamp: result.rows[0].now });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }
}

