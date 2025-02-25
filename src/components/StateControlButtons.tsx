import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { Button } from "@/components/ui/button";

export default function StateControlButtons() {
  const { state, dispatch } = useTerminal();
  const { terminalState } = state.terminal;

  // Don't render if no job is loaded
  if (!state.currentJob) return null;

  const handleStateChange = (newState: typeof terminalState) => {
    dispatch(terminalActions.setTerminalState(newState));
  };

  const handleAbandon = () => {
    // Clear user
    dispatch(terminalActions.setLoggedInUser(null));
    localStorage.removeItem("loggedUser");

    // Clear job
    dispatch(terminalActions.resetJob());

    // Reset terminal state
    handleStateChange("IDLE");
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4 justify-center">
      {/* Setup Complete button */}
      {terminalState === "SETUP" && (
        <Button
          onClick={() => handleStateChange("RUNNING")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Setup Complete
        </Button>
      )}

      {/* Running Complete button */}
      {terminalState === "RUNNING" && (
        <Button
          onClick={() => handleStateChange("IDLE")}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Running Complete
        </Button>
      )}

      {/* Inspect button */}
      {terminalState === "RUNNING" && (
        <Button
          onClick={() => handleStateChange("INSPECTION_REQUIRED")}
          className="bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          Inspect
        </Button>
      )}

      {/* Pause button */}
      {terminalState === "RUNNING" && (
        <Button
          onClick={() => handleStateChange("PAUSED")}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Pause
        </Button>
      )}

      {/* Resume button */}
      {terminalState === "PAUSED" && (
        <Button
          onClick={() => handleStateChange("RUNNING")}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          Resume
        </Button>
      )}

      {/* Abandon Button - Clears User and Job */}
      <Button
        onClick={handleAbandon}
        className="bg-red-500 hover:bg-red-600 text-white"
      >
        Abandon
      </Button>

      {/* Report Issue button */}
      <Button
        onClick={() => console.log("Report Issue button clicked")}
        className="bg-gray-700 hover:bg-gray-800 text-white"
      >
        Report Issue
      </Button>
    </div>
  );
}
