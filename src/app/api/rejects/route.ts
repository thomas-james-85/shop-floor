// src/app/api/rejects/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { RejectEmailData, sendRemanufactureEmail } from "@/utils/emailService";

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
      operator_name,
      supervisor_name,
      machine_name,
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

    // Prepare and send the email notification
    const emailData: RejectEmailData = {
      rejectId: result.rows[0].reject_id,
      customerName: customer_name,
      contractNumber: contract_number,
      routeCard: route_card,
      partNumber: part_number,
      qtyRejected: qty_rejected,
      remanufactureQty: remanufacture_qty,
      operatorName: operator_name || operator_id,
      supervisorName: supervisor_name || supervisor_id,
      reason: reason,
      operationCode: operation_code,
      machineName: machine_name || machine_id,
      createdAt: result.rows[0].created_at,
    };

    // Send the email notification
    const emailResult = await sendRemanufactureEmail(emailData);

    // Return the new reject ID and timestamp with actual email status
    return NextResponse.json({
      success: true,
      message: "Remanufacture request created successfully",
      reject_id: result.rows[0].reject_id,
      created_at: result.rows[0].created_at,
      email_sent: emailResult.success,
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
