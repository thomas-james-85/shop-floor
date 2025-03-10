import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { employee_id, role_required } = await req.json();

    // Validate input
    if (!employee_id || !role_required) {
      return NextResponse.json(
        { error: "Missing employee_id or role_required" },
        { status: 400 }
      );
    }

    // Fetch user data from database
    const result = await db.query(
      `SELECT name, can_operate, can_setup, can_inspect, can_remanufacture, active 
       FROM users WHERE employee_id = $1`,
      [employee_id]
    );

    if (!result.rowCount || result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.active) {
      return NextResponse.json({ error: "User is inactive" }, { status: 403 });
    }

    // Role verification
    const roleMapping: Record<string, boolean> = {
      can_operate: user.can_operate,
      can_setup: user.can_setup,
      can_inspect: user.can_inspect,
      can_remanufacture: user.can_remanufacture,
    };

    if (!roleMapping[role_required]) {
      return NextResponse.json(
        { error: `User does not have ${role_required} permissions` },
        { status: 403 }
      );
    }

    // ✅ User is authorized
    return NextResponse.json({ success: true, name: user.name });
  } catch (error) {
    console.error("Authentication Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
