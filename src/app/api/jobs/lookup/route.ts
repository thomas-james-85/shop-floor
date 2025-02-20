import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scan, operation_code } = body;

    if (!scan || !operation_code) {
      return NextResponse.json(
        { error: "Missing scan or operation_code" },
        { status: 400 }
      );
    }

    // Construct lookup_code
    const lookup_code = `${scan}-${operation_code}`;

    // Query the database
    const result = await db.query(
      `SELECT 
        contract_number, route_card, part_number, op_code, 
        planned_setup_time, planned_run_time, quantity, 
        customer_name, description, due_date, balance, 
        status, completed_qty
      FROM jobs
      WHERE lookup_code = $1`,
      [lookup_code]
    );

    // If no job is found, return a 404 response
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Return job details
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
