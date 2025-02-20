import { JobData, TerminalData } from "@/types";

export const handleJobScanned = async (
  barcode: string,
  terminalData: TerminalData | null
): Promise<JobData | null> => {
  if (!terminalData) {
    console.error("handleJobScanned: No terminal data provided.");
    return null;
  }

  try {
    console.log(
      `Scanning job with barcode: ${barcode}, operation: ${terminalData.operationCode}`
    );

    const response = await fetch("/api/jobs/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan: barcode,
        operation_code: terminalData.operationCode,
      }),
    });

    const data: JobData | { error: string } = await response.json();

    if (!response.ok || "error" in data) {
      console.error(
        `API Error: ${"error" in data ? data.error : "Unknown error"}`
      );
      alert(`Error: ${"error" in data ? data.error : "Unknown error"}`);
      return null;
    }

    // ✅ Ask user if job is marked "Complete"
    if (data.status === "Complete") {
      const confirmContinue = window.confirm(
        "This job's status is Complete. Do you wish to continue?"
      );
      if (!confirmContinue) {
        return null;
      }
    }

    console.log("Job Data Retrieved Successfully:", data);
    return data; // ✅ Correctly returning JobData
  } catch (error) {
    console.error("Scan Error:", error);
    alert("An error occurred. Please try again.");
    return null;
  }
};
