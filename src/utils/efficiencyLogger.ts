// src/utils/efficiencyLogger.ts - Updated to include time_saved field
import { JobData } from "@/types";
import { EfficiencyMetrics, calculateJobEfficiency } from "./efficiencyCalculator";

interface LogEfficiencyParams {
  jobLogId: number;
  lookupCode: string;
  logType: "SETUP" | "RUNNING";
  startTime: Date | string;
  endTime: Date | string;
  jobData: JobData;
  quantity?: number; // Required for RUNNING logs
  operatorId?: string; // Added for compatibility with efficiency_metrics
  machineId?: string; // Added for compatibility with efficiency_metrics
}

/**
 * Logs efficiency metrics to the database
 * @returns Object containing success status and efficiency metrics
 */
export const logEfficiency = async (
  params: LogEfficiencyParams
): Promise<{
  success: boolean;
  efficiencyMetrics?: EfficiencyMetrics;
  error?: string;
}> => {
  try {
    // Calculate efficiency metrics
    const metrics = calculateJobEfficiency(
      params.jobData,
      params.logType,
      params.startTime,
      params.endTime,
      params.quantity
    );

    // Create the efficiency metric in the database
    const response = await fetch("/api/logs/efficiency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_log_id: params.jobLogId,
        lookup_code: params.lookupCode,
        metric_type: params.logType, // Changed from log_type to metric_type
        planned_time: metrics.planned,
        actual_time: metrics.actual,
        efficiency_percentage: metrics.efficiency, // Changed from efficiency to efficiency_percentage
        time_saved: metrics.timeSaved, // Added time_saved field
        planned_qty: params.logType === "RUNNING" ? params.jobData.quantity : null,
        completed_qty: metrics.quantity,
        operator_id: params.operatorId || null,
        machine_id: params.machineId || null
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to log efficiency:", data.error);
      return { success: false, error: data.error };
    }

    return {
      success: true,
      efficiencyMetrics: metrics,
    };
  } catch (error) {
    console.error("Error logging efficiency:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Retrieves efficiency metrics for a specific job log
 */
export const getEfficiencyForJobLog = async (
  jobLogId: number
): Promise<{
  success: boolean;
  efficiencyLog?: any;
  error?: string;
}> => {
  try {
    const response = await fetch(`/api/logs/efficiency?job_log_id=${jobLogId}`);
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    // Return the first log if available
    return {
      success: true,
      efficiencyLog: data.metrics && data.metrics.length > 0 ? data.metrics[0] : null,
    };
  } catch (error) {
    console.error("Error fetching efficiency log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};