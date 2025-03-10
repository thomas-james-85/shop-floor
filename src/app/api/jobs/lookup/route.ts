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

    // Extract route card and contract number from scan
    // Assuming scan format contains the route card
    // This may need adjustment based on actual barcode format
    const route_card = scan;

    // Construct lookup_code
    const lookup_code = `${scan}-${operation_code}`;

    // Try exact lookup first
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

    // If job is found, return it
    if (result.rowCount > 0) {
      return NextResponse.json(result.rows[0]);
    }

    // If exact lookup fails, check if the route card exists
    const routeCardResult = await db.query(
      `SELECT 
        op_code, description, contract_number
      FROM jobs
      WHERE route_card = $1`,
      [route_card]
    );

    if (routeCardResult.rowCount === 0) {
      // Route card doesn't exist in database
      return NextResponse.json(
        { 
          error: "Job not found in database",
          code: "NOT_FOUND"
        }, 
        { status: 404 }
      );
    }

    // Route card exists but operation not assigned
    const existing_operations = routeCardResult.rows;
    const contract_number = existing_operations[0]?.contract_number || "";

    return NextResponse.json(
      {
        error: "Operation not assigned to this job",
        code: "OPERATION_NOT_ASSIGNED",
        route_card,
        contract_number,
        operation_code,
        existing_operations
      },
      { status: 409 } // Conflict - indicates route exists but operation missing
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
