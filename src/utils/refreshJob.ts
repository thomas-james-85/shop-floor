// src/utils/refreshJob.ts
import { JobData, TerminalData } from "@/types";

/**
 * Fetch the latest job data from the API
 * @param currentJob Current job data
 * @param terminalData Current terminal data
 * @returns Promise with updated job data or null
 */
export const refreshJobData = async (
  currentJob: JobData | null,
  terminalData: TerminalData
): Promise<JobData | null> => {
  if (!currentJob || !terminalData.operationCode) {
    console.warn("Cannot refresh job: missing job or operation code");
    return null;
  }

  try {
    // We'll use the route_card and contract_number to form the scan code
    const scan = `${currentJob.route_card}-${currentJob.contract_number}`;

    console.log(
      `Refreshing job data for ${scan} with op code ${terminalData.operationCode}`
    );

    const response = await fetch("/api/jobs/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan: scan,
        operation_code: terminalData.operationCode,
      }),
    });

    const data = await response.json();

    if (!response.ok || "error" in data) {
      console.error(
        "Failed to refresh job data:",
        "error" in data ? data.error : "Unknown error"
      );
      return null;
    }

    console.log("Job refreshed successfully:", data);
    return data;
  } catch (error) {
    console.error("Error refreshing job data:", error);
    return null;
  }
};
