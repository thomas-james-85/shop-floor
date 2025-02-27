// src/utils/jobUpdates.ts
import { JobData } from "@/types";

/**
 * Updates a job's completed quantity, balance, and status in the database
 * @param job The job data object
 * @param completedQty The quantity completed in this operation
 * @param isIncremental Whether to add to existing completed quantity (true) or replace it (false)
 */
export const updateJobCompletion = async (
  job: JobData,
  completedQty: number,
  isIncremental: boolean = true
): Promise<{
  success: boolean;
  updatedJob?: Partial<JobData>;
  message?: string;
  error?: string;
}> => {
  if (!job) {
    return { success: false, error: "No job data provided" };
  }

  try {
    // Generate lookup_code from job data
    const lookup_code = `${job.route_card}-${job.contract_number}-${job.op_code}`;

    const response = await fetch("/api/jobs/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lookup_code,
        completed_qty: completedQty,
        is_incremental: isIncremental,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Job update failed:", data.error);
      return { success: false, error: data.error || "Job update failed" };
    }

    return {
      success: true,
      updatedJob: data.job,
    };
  } catch (error) {
    console.error("Job update error:", error);
    return { success: false, error: "Failed to update job" };
  }
};
