// src/utils/efficiencyLogger.ts
import { JobData } from "@/types";
import {
  EfficiencyMetrics,
  calculateJobEfficiency,
} from "./efficiencyCalculator";

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

interface ApiResponse {
  success: boolean;
  error?: string;
  efficiencyLog?: Record<string, unknown>;
  metrics?: Array<Record<string, unknown>>;
  metric_id?: number;
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
    console.log("Starting efficiency logging with params:", {
      jobLogId: params.jobLogId,
      logType: params.logType,
      lookupCode: params.lookupCode,
      quantity: params.quantity,
      startTime:
        typeof params.startTime === "string"
          ? params.startTime
          : params.startTime.toISOString(),
      endTime:
        typeof params.endTime === "string"
          ? params.endTime
          : params.endTime.toISOString(),
    });

    // Validate required parameters
    if (!params.jobData) {
      console.error("Missing required jobData in logEfficiency");
      return {
        success: false,
        error: "Missing job data for efficiency calculation",
      };
    }

    // Calculate efficiency metrics
    const metrics = calculateJobEfficiency(
      params.jobData,
      params.logType,
      params.startTime,
      params.endTime,
      params.quantity
    );

    console.log("Calculated efficiency metrics:", metrics);

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
        planned_qty:
          params.logType === "RUNNING" ? params.jobData.quantity : null,
        completed_qty: metrics.quantity,
        operator_id: params.operatorId || null,
        machine_id: params.machineId || null,
      }),
    });

    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      console.error("Failed to log efficiency:", data.error);
      return { success: false, error: data.error };
    }

    console.log("Successfully logged efficiency with ID:", data.metric_id);

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
  efficiencyLog?: Record<string, unknown>;
  efficiencyMetrics?: EfficiencyMetrics;
  error?: string;
}> => {
  try {
    console.log(`Fetching efficiency metrics for job log ID: ${jobLogId}`);

    const response = await fetch(`/api/logs/efficiency?job_log_id=${jobLogId}`);
    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      console.error("API error fetching efficiency metrics:", data.error);
      return { success: false, error: data.error };
    }

    console.log("Retrieved efficiency data:", data);

    // Check if metrics exist
    if (!data.metrics || data.metrics.length === 0) {
      console.warn(`No efficiency metrics found for job log ID: ${jobLogId}`);
      return {
        success: false,
        error: "No efficiency metrics found",
      };
    }

    // Get the most recent log
    const effLog = data.metrics[0];
    console.log("Using efficiency metric:", effLog);

    // Convert API data to EfficiencyMetrics format
    const efficiencyMetrics: EfficiencyMetrics = {
      planned: effLog.planned_time as number,
      actual: effLog.actual_time as number,
      efficiency: (effLog.efficiency_percentage || effLog.efficiency) as number,
      timeSaved: (effLog.time_saved || effLog.time_difference) as number,
    };

    // Add quantity data if available
    if (effLog.completed_qty !== undefined && effLog.completed_qty !== null) {
      efficiencyMetrics.quantity = effLog.completed_qty as number;
    }

    // Add planned per item if available
    if (
      effLog.planned_qty !== undefined &&
      effLog.planned_qty !== null &&
      effLog.completed_qty
    ) {
      const plannedQty = effLog.planned_qty as number;
      const completedQty = effLog.completed_qty as number;

      if (plannedQty > 0 && completedQty > 0) {
        efficiencyMetrics.plannedPerItem =
          (effLog.planned_time as number) / plannedQty;
      }
    }

    return {
      success: true,
      efficiencyLog: effLog,
      efficiencyMetrics: efficiencyMetrics,
    };
  } catch (error) {
    console.error("Error fetching efficiency log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Retrieves all efficiency metrics for a specific job (lookup_code)
 */
export const getEfficiencyForJob = async (
  lookupCode: string,
  metricType?: "SETUP" | "RUNNING",
  limit: number = 10
): Promise<{
  success: boolean;
  metrics?: Array<Record<string, unknown>>;
  error?: string;
}> => {
  try {
    let url = `/api/logs/efficiency?lookup_code=${encodeURIComponent(
      lookupCode
    )}`;

    if (metricType) {
      url += `&metric_type=${encodeURIComponent(metricType)}`;
    }

    url += `&limit=${limit}`;

    const response = await fetch(url);
    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      metrics: data.metrics,
    };
  } catch (error) {
    console.error("Error fetching job efficiency metrics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Helper function to convert API response to EfficiencyMetrics format
 */
export const convertApiToEfficiencyMetrics = (
  apiData: Record<string, unknown>
): EfficiencyMetrics => {
  const metrics: EfficiencyMetrics = {
    planned: apiData.planned_time as number,
    actual: apiData.actual_time as number,
    efficiency: (apiData.efficiency_percentage || apiData.efficiency) as number,
    timeSaved: (apiData.time_saved || apiData.time_difference) as number,
  };

  // Add quantity data if available
  if (apiData.completed_qty !== undefined && apiData.completed_qty !== null) {
    metrics.quantity = apiData.completed_qty as number;
  }

  // Calculate planned per item if both planned_qty and completed_qty are available
  if (
    apiData.planned_qty !== undefined &&
    apiData.planned_qty !== null &&
    apiData.completed_qty !== undefined &&
    apiData.completed_qty !== null
  ) {
    const plannedQty = apiData.planned_qty as number;
    const completedQty = apiData.completed_qty as number;

    if (plannedQty > 0 && completedQty > 0) {
      metrics.plannedPerItem = (apiData.planned_time as number) / plannedQty;
    }
  }

  return metrics;
};
