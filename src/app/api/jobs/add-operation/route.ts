import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const {
      route_card,
      contract_number,
      operation_code,
      one_off,
      replaces_operations,
      additional_operation,
      added_by
    } = await req.json();

    // Validate required fields
    if (!route_card || !operation_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate lookup_code
    const lookup_code = `${route_card}-${operation_code}`;

    // Check if operation already exists
    const checkExists = await db.query(
      `SELECT id FROM jobs WHERE lookup_code = $1`,
      [lookup_code]
    );

    if (checkExists.rowCount > 0) {
      return NextResponse.json(
        { error: "Operation already exists for this job" },
        { status: 409 }
      );
    }

    // Fetch a sample job for this route card to copy basic details
    const sampleJobResult = await db.query(
      `SELECT 
        contract_number, part_number, customer_name, 
        quantity, description, due_date, balance
      FROM jobs 
      WHERE route_card = $1 
      LIMIT 1`,
      [route_card]
    );

    // If no sample job, we can't add the operation
    if (sampleJobResult.rowCount === 0) {
      return NextResponse.json(
        { error: "No job template found for this route card" },
        { status: 404 }
      );
    }

    const sampleJob = sampleJobResult.rows[0];
    const finalContractNumber = contract_number || sampleJob.contract_number;

    // Insert the new job operation
    const result = await db.query(
      `INSERT INTO jobs (
        route_card, 
        contract_number, 
        op_code, 
        lookup_code,
        part_number, 
        customer_name, 
        quantity, 
        description,
        due_date, 
        balance,
        status,
        user_added,
        one_off,
        replaces_operations,
        additional_operation,
        added_by,
        added_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Ready', 
        TRUE, $11, $12, $13, $14, NOW()
      ) RETURNING *`,
      [
        route_card,
        finalContractNumber,
        operation_code,
        lookup_code,
        sampleJob.part_number,
        sampleJob.customer_name,
        sampleJob.quantity,
        `User added operation: ${operation_code}`,
        sampleJob.due_date,
        sampleJob.balance,
        one_off || false,
        replaces_operations || null,
        additional_operation || false,
        added_by || null
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Failed to create new operation" },
        { status: 500 }
      );
    }

    // Return the newly created job
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}