// src/utils/jobLogs.ts
import { TerminalData, JobData } from "@/types";

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
  error?: string;
}

type ApiResponse = {
  success: boolean;
  log_id?: number;
  error?: string;
  logs?: Array<Record<string, unknown>>;
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

    return { success: true };
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
    let url = `/api/logs/job?lookup_code=${encodeURIComponent(lookup_code)}`;
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
 * End a SETUP log when inspection passes
 */
export const completeSetupLog = async (
  setup_log_id: number,
  comments?: string
): Promise<JobLogResponse> => {
  return updateJobLog(setup_log_id, {
    end_time: true, // Use current time
    comments,
  });
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
 * End a RUNNING log with completed quantity
 */
export const completeRunningLog = async (
  running_log_id: number,
  completedQty: number
): Promise<JobLogResponse> => {
  return updateJobLog(running_log_id, {
    end_time: true,
    completed_qty: completedQty,
  });
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

  // First, complete the current running log
  const updateResult = await updateJobLog(running_log_id, {
    end_time: true,
    completed_qty: completedQty,
  });

  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  // Then create the paused log
  // Format lookup_code properly
  const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

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

  // First, end the paused log
  const updateResult = await updateJobLog(paused_log_id, {
    end_time: true,
  });

  if (!updateResult.success) {
    return { success: false, error: updateResult.error };
  }

  // Then create the new running log
  return startRunningLog(jobData, terminalData, operatorId);
};