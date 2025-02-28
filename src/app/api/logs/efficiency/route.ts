import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const {
      job_log_id,
      lookup_code,
      metric_type,
      planned_time,
      actual_time,
      efficiency_percentage,
      time_saved, // Added time_saved parameter
      planned_qty,
      completed_qty,
      operator_id,
      machine_id,
    } = await req.json();

    // Validation
    if (
      !job_log_id ||
      !lookup_code ||
      !metric_type ||
      planned_time === undefined ||
      actual_time === undefined ||
      efficiency_percentage === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate metric_type (setup or running)
    if (metric_type !== "SETUP" && metric_type !== "RUNNING") {
      return NextResponse.json(
        { error: "Invalid metric_type, must be SETUP or RUNNING" },
        { status: 400 }
      );
    }

    try {
      // Check if the time_saved column exists on the table
      const columnCheckResult = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'efficiency_metrics' 
        AND column_name = 'time_saved'
      `);

      // If time_saved column doesn't exist, add it to the table
      if (columnCheckResult.rowCount === 0) {
        console.log("time_saved column doesn't exist, adding it...");
        try {
          await db.query(`
            ALTER TABLE public.efficiency_metrics
            ADD COLUMN time_saved numeric NULL;

            COMMENT ON COLUMN public.efficiency_metrics.time_saved IS 'Time saved/lost in minutes (positive = saved time, negative = exceeded time)';
          `);
          console.log("Added time_saved column successfully");
        } catch (error) {
          console.error("Error adding time_saved column:", error);
          // Continue anyway, we'll just insert without this column
        }
      }

      // Insert new efficiency metric
      const result = await db.query(
        `INSERT INTO efficiency_metrics 
        (job_log_id, lookup_code, metric_type, planned_time, actual_time, 
         efficiency_percentage, time_saved, planned_qty, completed_qty, operator_id, machine_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING metric_id`,
        [
          job_log_id,
          lookup_code,
          metric_type,
          planned_time,
          actual_time,
          efficiency_percentage,
          time_saved || null, // Include time_saved in the insert
          planned_qty || null,
          completed_qty || null,
          operator_id || null,
          machine_id || null,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Efficiency metric created successfully",
        metric_id: result.rows[0].metric_id,
      });
    } catch (insertError: unknown) {
      // Check if error is about the time_saved column not existing
      const errorMessage =
        insertError instanceof Error
          ? insertError.message
          : String(insertError);

      if (
        errorMessage.includes(
          'column "time_saved" of relation "efficiency_metrics" does not exist'
        )
      ) {
        try {
          const resultWithoutTimeSaved = await db.query(
            `INSERT INTO efficiency_metrics 
            (job_log_id, lookup_code, metric_type, planned_time, actual_time, 
             efficiency_percentage, planned_qty, completed_qty, operator_id, machine_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING metric_id`,
            [
              job_log_id,
              lookup_code,
              metric_type,
              planned_time,
              actual_time,
              efficiency_percentage,
              planned_qty || null,
              completed_qty || null,
              operator_id || null,
              machine_id || null,
            ]
          );

          return NextResponse.json({
            success: true,
            message:
              "Efficiency metric created successfully (without time_saved)",
            metric_id: resultWithoutTimeSaved.rows[0].metric_id,
          });
        } catch (fallbackError: unknown) {
          const fallbackErrorMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : "unknown error";

          console.error("Fallback insert error:", fallbackError);
          return NextResponse.json(
            { error: `Fallback insert error: ${fallbackErrorMessage}` },
            { status: 500 }
          );
        }
      }

      console.error("Efficiency Metric Insert Error:", insertError);
      const errorMsg =
        insertError instanceof Error ? insertError.message : "unknown error";
      return NextResponse.json(
        { error: `Insert error: ${errorMsg}` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Efficiency Metric Creation Error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `General error: ${errorMsg}` },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const job_log_id = searchParams.get("job_log_id");
    const lookup_code = searchParams.get("lookup_code");
    const metric_type = searchParams.get("metric_type");
    const limit = searchParams.get("limit") || "10";

    // Build query conditions
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (job_log_id) {
      conditions.push(`job_log_id = $${paramIndex++}`);
      queryParams.push(job_log_id);
    }

    if (lookup_code) {
      conditions.push(`lookup_code = $${paramIndex++}`);
      queryParams.push(lookup_code);
    }

    if (metric_type) {
      conditions.push(`metric_type = $${paramIndex++}`);
      queryParams.push(metric_type);
    }

    // Construct WHERE clause if conditions exist
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Execute query
    const query = `
      SELECT * FROM efficiency_metrics
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex}
    `;

    queryParams.push(limit);
    const result = await db.query(query, queryParams);

    return NextResponse.json({
      success: true,
      metrics: result.rows,
    });
  } catch (error: unknown) {
    console.error("Efficiency Metric Retrieval Error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: `Retrieval error: ${errorMsg}` },
      { status: 500 }
    );
  }
}
