// src/utils/efficiencyCalculator.ts
import { JobData } from "@/types";

export interface EfficiencyMetrics {
  planned: number; // in minutes
  actual: number; // in minutes
  efficiency: number; // percentage
  timeSaved: number; // minutes (positive = saved time, negative = over time)
  quantity?: number; // for running logs
  plannedPerItem?: number; // for running logs
}

/**
 * Calculates efficiency metrics for setup operations
 * @param plannedTimeMinutes Planned time in minutes
 * @param startTime Start timestamp
 * @param endTime End timestamp
 */
export const calculateSetupEfficiency = (
  plannedTimeMinutes: number,
  startTime: Date | string,
  endTime: Date | string
): EfficiencyMetrics => {
  // Convert to Date objects if strings
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const end = typeof endTime === "string" ? new Date(endTime) : endTime;

  // Calculate actual time in minutes
  const actualTimeMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  // Calculate efficiency (planned/actual * 100)
  // If actual time is 0, set efficiency to 100% to avoid division by zero
  const efficiency = actualTimeMinutes === 0 
    ? 100 
    : Math.round((plannedTimeMinutes / actualTimeMinutes) * 100);

  // Calculate time saved/lost (positive = saved time, negative = over time)
  const timeSaved = Math.round((plannedTimeMinutes - actualTimeMinutes) * 10) / 10;

  return {
    planned: plannedTimeMinutes,
    actual: Math.round(actualTimeMinutes * 10) / 10, // Round to 1 decimal place
    efficiency,
    timeSaved,
  };
};

/**
 * Calculates efficiency metrics for running operations, accounting for quantity
 * @param plannedTimeMinutes Total planned time in minutes for all units
 * @param totalQuantity Total job quantity
 * @param completedQuantity Quantity completed in this operation
 * @param startTime Start timestamp
 * @param endTime End timestamp
 */
export const calculateRunningEfficiency = (
  plannedTimeMinutes: number,
  totalQuantity: number,
  completedQuantity: number,
  startTime: Date | string,
  endTime: Date | string
): EfficiencyMetrics => {
  // Convert to Date objects if strings
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const end = typeof endTime === "string" ? new Date(endTime) : endTime;

  // Calculate planned time per item in minutes
  const plannedPerItem = plannedTimeMinutes / totalQuantity;

  // Calculate adjusted planned time based on completed quantity
  const adjustedPlannedTime = plannedPerItem * completedQuantity;

  // Calculate actual time in minutes
  const actualTimeMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

  // Calculate efficiency (adjustedPlanned/actual * 100)
  // If actual time is 0, set efficiency to 100% to avoid division by zero
  const efficiency = actualTimeMinutes === 0 
    ? 100 
    : Math.round((adjustedPlannedTime / actualTimeMinutes) * 100);

  // Calculate time saved/lost (positive = saved time, negative = over time)
  const timeSaved = Math.round((adjustedPlannedTime - actualTimeMinutes) * 10) / 10;

  return {
    planned: Math.round(adjustedPlannedTime * 10) / 10, // Round to 1 decimal place
    actual: Math.round(actualTimeMinutes * 10) / 10, // Round to 1 decimal place
    efficiency,
    timeSaved,
    quantity: completedQuantity,
    plannedPerItem: Math.round(plannedPerItem * 100) / 100, // Round to 2 decimal places
  };
};

/**
 * Calculate efficiency for a job log based on job data and log timestamps
 * @param jobData Job data
 * @param logType Type of log (SETUP or RUNNING)
 * @param startTime Start timestamp
 * @param endTime End timestamp
 * @param completedQuantity Quantity completed (required for RUNNING logs)
 */
export const calculateJobEfficiency = (
  jobData: JobData,
  logType: "SETUP" | "RUNNING",
  startTime: Date | string,
  endTime: Date | string,
  completedQuantity?: number
): EfficiencyMetrics => {
  if (logType === "SETUP") {
    return calculateSetupEfficiency(
      jobData.planned_setup_time,
      startTime,
      endTime
    );
  } else if (logType === "RUNNING") {
    if (completedQuantity === undefined) {
      throw new Error("Completed quantity is required for RUNNING efficiency calculation");
    }
    
    return calculateRunningEfficiency(
      jobData.planned_run_time,
      jobData.quantity,
      completedQuantity,
      startTime,
      endTime
    );
  } else {
    throw new Error(`Invalid log type: ${logType}`);
  }
};