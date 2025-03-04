// src/utils/jobLogs.ts
import { TerminalData, JobData } from "@/types";
import { logEfficiency } from "./efficiencyLogger";
import { EfficiencyMetrics } from "./efficiencyCalculator";

interface JobLogParams {
  lookup_code: string;
  user_id: string;
  machine_id: string;
  state: "SETUP" | "RUNNING" | "PAUSED" | "INSPECTION";
  start_time?: string; // ISO format
  end_time?: string; // ISO format
  completed_qty?: number;
  comments?: string;
  inspection_passed?: boolean;
  inspection_type?: "1st_off" | "in_process";
  inspection_qty?: number;
}

// This extended interface allows for setting end_time to boolean for the convenience flag
interface JobLogUpdateParams {
  end_time?: string | boolean; // Can be string or true (to use current time)
  completed_qty?: number;
  comments?: string;
  inspection_passed?: boolean;
  inspection_type?: "1st_off" | "in_process";
  inspection_qty?: number;
}

interface JobLogResponse {
  success: boolean;
  log_id?: number;
  log?: Record<string, unknown>;
  error?: string;
}

type ApiResponse = {
  success: boolean;
  log_id?: number;
  error?: string;
  logs?: Array<Record<string, unknown>>;
  log?: Record<string, unknown>;
  message?: string;
};

/**
 * Create a new job log entry
 */
export const createJobLog = async (
  params: JobLogParams
): Promise<JobLogResponse> => {
  try {
    // Set start_time to now if not provided
    const logParams = {
      ...params,
      start_time: params.start_time || new Date().toISOString(),
    };

    const response = await fetch("/api/logs/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logParams),
    });

    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      console.error("Failed to create job log:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true, log_id: data.log_id };
  } catch (error) {
    console.error("Job Log Error:", error);
    return { success: false, error: "Failed to create job log" };
  }
};

/**
 * Update an existing job log entry
 */
export const updateJobLog = async (
  log_id: number,
  updateParams: JobLogUpdateParams
): Promise<JobLogResponse> => {
  try {
    // Create a clean object for sending to the API
    const cleanParams: Record<string, string | number | boolean | null> = {
      ...updateParams,
    };

    // Convert boolean end_time to ISO string if it's true
    if (updateParams.end_time === true) {
      cleanParams.end_time = new Date().toISOString();
    }

    const response = await fetch("/api/logs/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        log_id,
        ...cleanParams,
      }),
    });

    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      console.error("Failed to update job log:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true, log: data.log };
  } catch (error) {
    console.error("Job Log Update Error:", error);
    return { success: false, error: "Failed to update job log" };
  }
};

/**
 * Get the current open log for a job
 */
export const getCurrentJobLog = async (
  lookup_code: string,
  state?: "SETUP" | "RUNNING" | "PAUSED" | "INSPECTION"
): Promise<{
  success: boolean;
  log?: Record<string, unknown>;
  error?: string;
}> => {
  try {
    let url = `/api/logs/jobs?lookup_code=${encodeURIComponent(lookup_code)}`;
    if (state) {
      url += `&state=${encodeURIComponent(state)}`;
    }

    const response = await fetch(url);
    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      log: data.logs?.[0], // Return the first log, if any
    };
  } catch (error) {
    console.error("Get Job Log Error:", error);
    return { success: false, error: "Failed to retrieve job log" };
  }
};

/**
 * Get a specific job log by ID
 */
export const getJobLogById = async (
  log_id: number
): Promise<{
  success: boolean;
  log?: Record<string, unknown>;
  error?: string;
}> => {
  try {
    const response = await fetch(`/api/logs/jobs?log_id=${log_id}`);
    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      log: data.log,
    };
  } catch (error) {
    console.error("Get Job Log Error:", error);
    return { success: false, error: "Failed to retrieve job log" };
  }
};

// Specialized helper functions for specific state transitions

/**
 * Start a SETUP log when transitioning from IDLE to SETUP
 */
export const startSetupLog = async (
  jobData: JobData,
  terminalData: TerminalData,
  setterId: string
): Promise<{ success: boolean; log_id?: number; error?: string }> => {
  if (!jobData) {
    return { success: false, error: "Missing job data" };
  }

  // Format lookup_code properly
  const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

  return createJobLog({
    lookup_code,
    user_id: setterId,
    machine_id: terminalData.terminalId?.toString() || "",
    state: "SETUP",
  });
};

/**
 * Create a new inspection log without ending the setup log
 * Modified to handle the case of repeated inspections after failure
 */
export const createInspectionLog = async (
  jobData: JobData,
  terminalData: TerminalData,
  inspectorId: string,
  inspectionType: "1st_off" | "in_process",
  comments?: string
): Promise<{
  success: boolean;
  inspection_log_id?: number;
  error?: string;
}> => {
  if (!jobData) {
    return { success: false, error: "Missing job data" };
  }

  // Format lookup_code properly
  const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

  const inspectionResult = await createJobLog({
    lookup_code,
    user_id: inspectorId,
    machine_id: terminalData.terminalId?.toString() || "",
    state: "INSPECTION",
    inspection_type: inspectionType,
    inspection_qty: inspectionType === "1st_off" ? 1 : undefined,
    comments,
  });

  return {
    success: inspectionResult.success,
    inspection_log_id: inspectionResult.log_id,
    error: inspectionResult.error,
  };
};

/**
 * End a SETUP log when inspection passes, and log efficiency
 */
export const completeSetupLog = async (
  setup_log_id: number,
  jobData: JobData,
  comments?: string
): Promise<{
  success: boolean;
  log?: Record<string, unknown>;
  efficiencyTracked?: boolean;
  efficiencyMetrics?: EfficiencyMetrics;
  error?: string;
}> => {
  try {
    console.log(`Starting completeSetupLog for log_id: ${setup_log_id}`);

    // First, get the job log to access its start time
    const jobLogResult = await getJobLogById(setup_log_id);

    if (!jobLogResult.success || !jobLogResult.log) {
      console.error("Failed to retrieve job log:", jobLogResult.error);
      return {
        success: false,
        error: jobLogResult.error || "Failed to retrieve job log",
      };
    }

    const jobLog = jobLogResult.log;
    const startTime = jobLog.start_time as string;
    const endTime = new Date().toISOString();
    const operatorId = jobLog.user_id as string; // Extract the setter ID
    const machineId = jobLog.machine_id as string; // Extract the machine ID

    console.log("Job log retrieved successfully:", {
      startTime,
      endTime,
      duration:
        (new Date(endTime).getTime() - new Date(startTime).getTime()) /
        1000 /
        60,
      minutes:
        (new Date(endTime).getTime() - new Date(startTime).getTime()) /
        1000 /
        60,
    });

    // Complete the setup log
    const updateResult = await updateJobLog(setup_log_id, {
      end_time: endTime,
      comments,
    });

    if (!updateResult.success) {
      console.error("Failed to update job log:", updateResult.error);
      return { success: false, error: updateResult.error };
    }

    console.log(
      "Setup log updated successfully, calculating efficiency metrics"
    );

    // Make sure planned_setup_time exists and is a positive number
    if (!jobData.planned_setup_time || jobData.planned_setup_time <= 0) {
      console.warn(
        `Invalid planned_setup_time: ${jobData.planned_setup_time}, using default value`
      );
      jobData.planned_setup_time = 30; // Default to 30 minutes
    }

    // Format lookup_code properly
    const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

    // Log efficiency metrics
    const efficiencyResult = await logEfficiency({
      jobLogId: setup_log_id,
      lookupCode: lookup_code,
      logType: "SETUP",
      startTime,
      endTime,
      jobData,
      operatorId,
      machineId,
    });

    console.log("Efficiency calculation result:", {
      success: efficiencyResult.success,
      metrics: efficiencyResult.efficiencyMetrics,
      error: efficiencyResult.error,
    });

    return {
      success: true,
      log: updateResult.log,
      efficiencyTracked: efficiencyResult.success,
      efficiencyMetrics: efficiencyResult.efficiencyMetrics,
    };
  } catch (error) {
    console.error("Error completing setup log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Complete an inspection and record the result
 */
export const completeInspection = async (
  inspection_log_id: number,
  passed: boolean,
  comments?: string,
  qty?: number
): Promise<JobLogResponse> => {
  return updateJobLog(inspection_log_id, {
    end_time: true,
    inspection_passed: passed,
    comments,
    inspection_qty: qty,
  });
};

/**
 * Start a RUNNING log when transitioning to production
 */
export const startRunningLog = async (
  jobData: JobData,
  terminalData: TerminalData,
  operatorId: string
): Promise<{ success: boolean; log_id?: number; error?: string }> => {
  if (!jobData) {
    return { success: false, error: "Missing job data" };
  }

  // Format lookup_code properly
  const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

  return createJobLog({
    lookup_code,
    user_id: operatorId,
    machine_id: terminalData.terminalId?.toString() || "",
    state: "RUNNING",
  });
};

/**
 * End a RUNNING log with completed quantity and log efficiency
 */
export const completeRunningLog = async (
  running_log_id: number,
  completedQty: number
): Promise<{
  success: boolean;
  log?: Record<string, unknown>;
  error?: string;
}> => {
  // We'll just update the log here - efficiency logging is handled separately
  // in the CompletionDialog component
  return updateJobLog(running_log_id, {
    end_time: true,
    completed_qty: completedQty,
  });
};

/**
 * End an active log when a job is abandoned and track efficiency if appropriate
 */
export const abandonJob = async (
  log_id: number,
  logState: "SETUP" | "RUNNING" | "PAUSED" | "INSPECTION",
  jobData: JobData | null,
  completedQty?: number,
  abandonReason?: string
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // First get the job log to access its start time (for efficiency tracking)
    if (
      (logState === "SETUP" ||
        (logState === "RUNNING" && completedQty && completedQty > 0)) &&
      jobData
    ) {
      const jobLogResult = await getJobLogById(log_id);

      if (jobLogResult.success && jobLogResult.log) {
        const jobLog = jobLogResult.log;
        const startTime = jobLog.start_time as string;
        const endTime = new Date().toISOString();
        const operatorId = jobLog.user_id as string; // Extract the user ID
        const machineId = jobLog.machine_id as string; // Extract the machine ID

        // Format lookup_code properly
        const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

        // Log efficiency metrics
        // Note: We're logging efficiency but not directly returning it here
        // The AbandonDialog component handles displaying the metrics
        try {
          await logEfficiency({
            jobLogId: log_id,
            lookupCode: lookup_code,
            logType: logState === "SETUP" ? "SETUP" : "RUNNING",
            startTime,
            endTime,
            jobData,
            quantity: logState === "RUNNING" ? completedQty : undefined,
            operatorId, // Add this
            machineId, // Add this
          });
        } catch (err) {
          console.error("Failed to log efficiency for abandoned job:", err);
          // Continue with abandonment even if efficiency logging fails
        }
      }
    }

    // Update the job log with abandon information
    const updateParams: JobLogUpdateParams = {
      end_time: true,
      comments: abandonReason ? `ABANDONED: ${abandonReason}` : "ABANDONED",
    };

    // Only add completed quantity for RUNNING logs
    if (logState === "RUNNING" && completedQty !== undefined) {
      updateParams.completed_qty = completedQty;
    }

    const result = await updateJobLog(log_id, updateParams);

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    console.error("Error abandoning job:", error);
    return {
      success: false,
      error: "Failed to log job abandonment",
    };
  }
};

/**
 * Pause a job: end current RUNNING log and create PAUSED log
 */
export const pauseJob = async (
  running_log_id: number,
  completedQty: number,
  jobData: JobData,
  terminalData: TerminalData,
  operatorId: string,
  pauseReason: string
): Promise<{ success: boolean; paused_log_id?: number; error?: string }> => {
  if (!jobData) {
    return { success: false, error: "Missing job data" };
  }

  try {
    // First, get the job log to access its start time (for efficiency calculation)
    const jobLogResult = await getJobLogById(running_log_id);

    if (!jobLogResult.success || !jobLogResult.log) {
      return {
        success: false,
        error: jobLogResult.error || "Failed to retrieve job log",
      };
    }

    const jobLog = jobLogResult.log;
    const startTime = jobLog.start_time as string;
    const endTime = new Date().toISOString();

    // Complete the current running log
    const updateResult = await updateJobLog(running_log_id, {
      end_time: endTime,
      completed_qty: completedQty,
    });

    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }

    // Log efficiency metrics for the partial run
    if (completedQty > 0) {
      const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

      await logEfficiency({
        jobLogId: running_log_id,
        lookupCode: lookup_code,
        logType: "RUNNING",
        startTime,
        endTime,
        jobData,
        quantity: completedQty,
      });
    }

    // Format lookup_code properly
    const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

    // Then create the paused log
    const pauseResult = await createJobLog({
      lookup_code,
      user_id: operatorId,
      machine_id: terminalData.terminalId?.toString() || "",
      state: "PAUSED",
      comments: pauseReason,
    });

    return {
      success: pauseResult.success,
      paused_log_id: pauseResult.log_id,
      error: pauseResult.error,
    };
  } catch (error) {
    console.error("Error during pause job:", error);
    return {
      success: false,
      error: "An unexpected error occurred during job pause",
    };
  }
};

/**
 * Resume a job: end PAUSED log and create new RUNNING log
 */
export const resumeJob = async (
  paused_log_id: number,
  jobData: JobData,
  terminalData: TerminalData,
  operatorId: string
): Promise<{ success: boolean; running_log_id?: number; error?: string }> => {
  if (!jobData) {
    return { success: false, error: "Missing job data" };
  }

  try {
    // First, end the paused log
    const updateResult = await updateJobLog(paused_log_id, {
      end_time: true,
    });

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || "Failed to end paused log",
      };
    }

    // Then create the new running log
    const runningLogResult = await startRunningLog(
      jobData,
      terminalData,
      operatorId
    );

    if (!runningLogResult.success) {
      return {
        success: false,
        error: runningLogResult.error || "Failed to create running log",
      };
    }

    return {
      success: true,
      running_log_id: runningLogResult.log_id,
    };
  } catch (error) {
    console.error("Resume Job Error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during job resumption",
    };
  }
};
