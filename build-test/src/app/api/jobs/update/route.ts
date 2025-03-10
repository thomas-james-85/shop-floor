// src/app/api/jobs/update/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: Request) {
  try {
    const {
      lookup_code,
      completed_qty,
      is_incremental = true,
    } = await req.json();

    if (!lookup_code) {
      return NextResponse.json(
        { error: "Missing required lookup_code" },
        { status: 400 }
      );
    }

    // First, get the current job data
    const jobResult = await db.query(
      `SELECT quantity, completed_qty, balance, status FROM jobs WHERE lookup_code = $1`,
      [lookup_code]
    );

    if (!jobResult.rowCount || jobResult.rowCount === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobResult.rows[0];
    const currentQty = job.quantity || 0;

    // Calculate the new completed quantity
    let newCompletedQty;
    if (is_incremental) {
      // Add to existing completed quantity
      newCompletedQty = (job.completed_qty || 0) + (completed_qty || 0);
    } else {
      // Replace completed quantity
      newCompletedQty = completed_qty || 0;
    }

    // Handle nulls for completed_qty and balance
    // If balance is null, use quantity as the starting point
    let currentBalance = job.balance;
    if (currentBalance === null) {
      currentBalance = currentQty;
    }

    // Calculate the balance (never less than 0)
    const balance = Math.max(0, currentQty - newCompletedQty);

    // Determine the status based on balance
    const status = balance === 0 ? "Complete" : "WIP";

    // Update the job
    const updateResult = await db.query(
      `UPDATE jobs 
       SET completed_qty = $1, balance = $2, status = $3
       WHERE lookup_code = $4
       RETURNING completed_qty, balance, status`,
      [newCompletedQty, balance, status, lookup_code]
    );

    if (!updateResult.rowCount || updateResult.rowCount === 0) {
      return NextResponse.json(
        { error: "Failed to update job" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Job updated successfully",
      job: updateResult.rows[0],
      completed_qty: newCompletedQty,
      previous_completed_qty: job.completed_qty || 0,
      quantity: currentQty,
    });
  } catch (error) {
    console.error("Job Update Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
