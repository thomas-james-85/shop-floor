import { JobData, TerminalData } from "@/types";

export const clearCurrentUser = (
  terminalData: TerminalData | null,
  setTerminalData: (data: TerminalData | null) => void
) => {
  if (!terminalData) return;

  console.log("Clearing logged-in user...");

  const updatedTerminalData = {
    ...terminalData,
    loggedInUser: null, // ✅ Ensure this is null
  };

  setTerminalData(updatedTerminalData);
  localStorage.setItem("terminalData", JSON.stringify(updatedTerminalData));

  console.log("User cleared successfully.");
};

// ✅ Ensure correct export
export const clearCurrentJob = (
  setScannedJob: (job: JobData | null) => void
) => {
  console.log("Clearing scanned job...");
  setScannedJob(null);
  console.log("Job cleared successfully.");
};
