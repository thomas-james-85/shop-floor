// src/app/api/logs/job/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const {
      lookup_code,
      user_id,
      machine_id,
      state,
      start_time,
      end_time,
      completed_qty,
      comments,
      inspection_passed,
      inspection_type,
      inspection_qty,
    } = await req.json();

    // Validation
    if (!user_id || !machine_id || !state || !start_time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert new log
    const result = await db.query(
      `INSERT INTO job_logs 
      (lookup_code, user_id, machine_id, state, start_time, end_time, 
       completed_qty, comments, inspection_passed, inspection_type, inspection_qty) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING log_id`,
      [
        lookup_code || null,
        user_id,
        machine_id,
        state,
        start_time,
        end_time || null,
        completed_qty || null,
        comments || null,
        inspection_passed !== undefined ? inspection_passed : null,
        inspection_type || null,
        inspection_qty || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Log created successfully",
      log_id: result.rows[0].log_id,
    });
  } catch (error) {
    console.error("Job Log Creation Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { log_id, ...updateFields } = await req.json();

    if (!log_id) {
      return NextResponse.json({ error: "Missing log_id" }, { status: 400 });
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      "end_time",
      "completed_qty",
      "comments",
      "inspection_passed",
      "inspection_qty",
    ];

    // Build the SET clause for the update query
    const updates: string[] = [];
    const values: any[] = [log_id]; // Start with log_id as $1
    let paramIndex = 2;

    // Add each field to the updates array if it's allowed and present
    Object.entries(updateFields).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // If no valid updates, return early
    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Execute the update query
    const updateQuery = `
      UPDATE job_logs 
      SET ${updates.join(", ")} 
      WHERE log_id = $1 
      RETURNING log_id, state, start_time, end_time`;

    const result = await db.query(updateQuery, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Log updated successfully",
      log: result.rows[0],
    });
  } catch (error) {
    console.error("Job Log Update Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get the current open log for a specific lookup_code and state (or any open log if state not provided)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lookup_code = searchParams.get("lookup_code");
    const state = searchParams.get("state");
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    if (!lookup_code) {
      return NextResponse.json(
        { error: "Missing lookup_code parameter" },
        { status: 400 }
      );
    }

    let query = `
      SELECT * FROM job_logs 
      WHERE lookup_code = $1
    `;

    const queryParams = [lookup_code];

    // Add state filter if provided
    if (state) {
      query += ` AND state = $${queryParams.length + 1}`;
      queryParams.push(state);
    }

    // Add end_time IS NULL filter unless includeCompleted is true
    if (!includeCompleted) {
      query += ` AND end_time IS NULL`;
    }

    query += ` ORDER BY start_time DESC`;

    const result = await db.query(query, queryParams);

    return NextResponse.json({
      success: true,
      logs: result.rows,
    });
  } catch (error) {
    console.error("Job Log Retrieval Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
