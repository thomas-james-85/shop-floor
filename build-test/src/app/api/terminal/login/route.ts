import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { terminal_id, password } = await req.json();

    if (!terminal_id || !password) {
      return NextResponse.json(
        { error: "Terminal ID and password required" },
        { status: 400 }
      );
    }

    // Query database for terminal details
    const result = await db.query(
      `SELECT t.terminal_id, t.terminal_name, t.operation_code, t.password, t.active, 
              o.operation_id
       FROM terminals t
       LEFT JOIN operations o ON t.operation_code = o.operation_code
       WHERE t.terminal_id = $1`,
      [terminal_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Terminal not found" },
        { status: 404 }
      );
    }

    const {
      terminal_name,
      operation_code,
      operation_id,
      password: storedPassword,
      active,
    } = result.rows[0];

    if (!active) {
      return NextResponse.json(
        { error: "Terminal is inactive" },
        { status: 403 }
      );
    }

    // Simple password match
    if (password !== storedPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    // Successful login, return terminal details
    return NextResponse.json({
      success: true,
      message: "Login successful",
      terminal_id,
      terminal_name,
      operation_code,
      operation_id,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
