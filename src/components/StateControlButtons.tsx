import { TerminalData, JobData } from "@/types";

type StateControlButtonsProps = {
  handleStateChange: (newState: TerminalData["terminalState"]) => void;
  terminalState: TerminalData["terminalState"];
  scannedJob: boolean;
  setScannedJob: (job: JobData | null) => void;
  loggedInUser: string | null;
  setLoggedInUser: (user: string | null) => void;
};

export default function StateControlButtons({
  handleStateChange,
  terminalState,
  scannedJob,
  setScannedJob,
  loggedInUser,
  setLoggedInUser,
}: StateControlButtonsProps) {
  if (!scannedJob) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-4 justify-center">
      {/* ✅ Restore Setup Complete button */}
      {terminalState === "SETUP" && (
        <button
          onClick={() => handleStateChange("RUNNING")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Setup Complete
        </button>
      )}

      {/* ✅ Restore Running Complete button */}
      {terminalState === "RUNNING" && (
        <button
          onClick={() => handleStateChange("IDLE")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Running Complete
        </button>
      )}

      {/* ✅ Restore Inspect button */}
      {terminalState === "RUNNING" && (
        <button
          onClick={() => console.log("Inspect button clicked")}
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Inspect
        </button>
      )}

      {/* ✅ Restore Pause button */}
      {terminalState === "RUNNING" && (
        <button
          onClick={() => handleStateChange("PAUSED")}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Pause
        </button>
      )}

      {/* ✅ Abandon Button - Clears Only the User */}
      <button
        onClick={() => {
          setLoggedInUser(null);
          localStorage.removeItem("loggedUser");

          setScannedJob(null);
          handleStateChange("IDLE");
        }}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Abandon
      </button>

      {/* ✅ Restore Report Issue button */}
      <button
        onClick={() => console.log("Report Issue button clicked")}
        className="bg-gray-700 text-white px-4 py-2 rounded"
      >
        Report Issue
      </button>
    </div>
  );
}
