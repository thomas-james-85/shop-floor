// src/app/api/rejects/reasons/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET endpoint to retrieve reject reasons by operation
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const operation_code = searchParams.get("operation_code");

    if (!operation_code) {
      return NextResponse.json(
        { error: "Missing operation_code parameter" },
        { status: 400 }
      );
    }

    // Get the operation ID from the operation code
    const operationQuery = await db.query(
      `SELECT o.operation_id 
       FROM operations o
       JOIN e2i_operations e ON e.operation_id = o.operation_id
       WHERE e.e2i_code = $1 AND e.active = true`,
      [operation_code]
    );

    if (!operationQuery.rowCount || operationQuery.rowCount === 0) {
      return NextResponse.json(
        { error: "Operation not found" },
        { status: 404 }
      );
    }

    const operationId = operationQuery.rows[0].operation_id;

    // Get the reject reasons for this operation
    const reasonsQuery = await db.query(
      `SELECT r.reject_id, r.reject_name, r.description
       FROM reject_reasons r
       JOIN operation_rejects o ON r.reject_id = o.reject_id
       WHERE o.operation_id = $1 AND r.active = true
       ORDER BY r.reject_name`,
      [operationId]
    );

    // Always include the "Other" reason
    const otherReasonQuery = await db.query(
      `SELECT reject_id, reject_name, description
       FROM reject_reasons
       WHERE reject_name = 'Other' AND active = true
       LIMIT 1`
    );

    const reasons = reasonsQuery.rows;

    // Add "Other" reason if it exists and is not already included
    if (otherReasonQuery.rowCount && otherReasonQuery.rowCount > 0) {
      const otherReason = otherReasonQuery.rows[0];
      const otherExists = reasons.some(
        (r) => r.reject_id === otherReason.reject_id
      );

      if (!otherExists) {
        reasons.push(otherReason);
      }
    }

    return NextResponse.json({
      success: true,
      operation_code,
      reasons,
    });
  } catch (error) {
    console.error("Reject Reasons Retrieval Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new reject reason
export async function POST(req: Request) {
  try {
    const { reject_name, description } = await req.json();

    if (!reject_name) {
      return NextResponse.json(
        { error: "Missing reject_name" },
        { status: 400 }
      );
    }

    // Check if the reason already exists
    const existingQuery = await db.query(
      `SELECT reject_id FROM reject_reasons WHERE reject_name = $1`,
      [reject_name]
    );

    if (existingQuery.rowCount && existingQuery.rowCount > 0) {
      return NextResponse.json(
        { error: "Reject reason with this name already exists" },
        { status: 409 }
      );
    }

    // Insert the new reason
    const result = await db.query(
      `INSERT INTO reject_reasons (reject_name, description, active)
       VALUES ($1, $2, true)
       RETURNING reject_id, reject_name, description, active, created_at`,
      [reject_name, description || null]
    );

    return NextResponse.json({
      success: true,
      message: "Reject reason created successfully",
      reason: result.rows[0],
    });
  } catch (error) {
    console.error("Reject Reason Creation Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
