// src/app/api/rejects/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

// POST endpoint to create a new reject record
export async function POST(req: Request) {
  try {
    const {
      customer_name,
      contract_number,
      route_card,
      part_number,
      qty_rejected,
      operator_id,
      supervisor_id,
      reason,
      remanufacture_qty,
      machine_id,
      operation_code,
    } = await req.json();

    // Validate required fields
    if (
      !customer_name ||
      !contract_number ||
      !route_card ||
      !part_number ||
      !qty_rejected ||
      !operator_id ||
      !supervisor_id ||
      !reason ||
      !remanufacture_qty ||
      !machine_id ||
      !operation_code
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert into the rejects table
    const result = await db.query(
      `INSERT INTO rejects (
        customer_name, 
        contract_number, 
        route_card, 
        part_number, 
        qty_rejected, 
        operator_id, 
        supervisor_id, 
        reason, 
        remanufacture_qty, 
        machine_id, 
        operation_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING reject_id, created_at`,
      [
        customer_name,
        contract_number,
        route_card,
        part_number,
        qty_rejected,
        operator_id,
        supervisor_id,
        reason,
        remanufacture_qty,
        machine_id,
        operation_code,
      ]
    );

    // Return the new reject ID and timestamp
    return NextResponse.json({
      success: true,
      message: "Remanufacture request created successfully",
      reject_id: result.rows[0].reject_id,
      created_at: result.rows[0].created_at,
      // In a real implementation, you'd include email status here
      email_sent: true, // Mocked for now
    });
  } catch (error) {
    console.error("Reject Creation Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve reject records by various filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract query parameters
    const reject_id = searchParams.get("reject_id");
    const contract_number = searchParams.get("contract_number");
    const route_card = searchParams.get("route_card");
    const operation_code = searchParams.get("operation_code");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Build query conditions
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (reject_id) {
      conditions.push(`reject_id = $${paramIndex++}`);
      queryParams.push(reject_id);
    }

    if (contract_number) {
      conditions.push(`contract_number = $${paramIndex++}`);
      queryParams.push(contract_number);
    }

    if (route_card) {
      conditions.push(`route_card = $${paramIndex++}`);
      queryParams.push(route_card);
    }

    if (operation_code) {
      conditions.push(`operation_code = $${paramIndex++}`);
      queryParams.push(operation_code);
    }

    // Construct the WHERE clause
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Execute the query
    const query = `
      SELECT * FROM rejects
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(limit);
    const result = await db.query(query, queryParams);

    return NextResponse.json({
      success: true,
      rejects: result.rows,
    });
  } catch (error) {
    console.error("Reject Retrieval Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
