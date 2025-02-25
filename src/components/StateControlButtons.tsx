import { useState } from "react";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { Button } from "@/components/ui/button";
import InspectionDialog from "@/components/InspectionDialog";
import OperatorAuthDialog from "@/components/OperatorAuthDialog";
import CompletionDialog from "@/components/CompletionDialog";

export default function StateControlButtons() {
  const { state, dispatch } = useTerminal();
  const { terminalState } = state.terminal;

  // State for dialog visibility
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [showOperatorAuthDialog, setShowOperatorAuthDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // Don't render if no job is loaded
  if (!state.currentJob) return null;

  // Handle setup complete button
  const handleSetupComplete = () => {
    // Show inspection dialog
    setShowInspectionDialog(true);
  };

  // Handle inspection completion
  const handleInspectionComplete = (
    passed: boolean,
    inspector: string,
    comments: string
  ) => {
    // Log inspection details (in a real app, this would be an API call)
    console.log(
      `First-off inspection ${passed ? "passed" : "failed"} by ${inspector}`
    );
    console.log("Comments:", comments);

    // Close inspection dialog
    setShowInspectionDialog(false);

    if (passed) {
      // Show operator authentication dialog
      setShowOperatorAuthDialog(true);
    } else {
      // Remain in SETUP state (already there)
      // Optionally show a notification about failed inspection
      alert("Inspection failed. Please correct the issues and try again.");
    }
  };

  // Handle operator authentication
  const handleOperatorAuthenticated = (operatorName: string) => {
    // Update terminal with operator name
    dispatch(terminalActions.setLoggedInUser(operatorName));

    // Change state to RUNNING
    dispatch(terminalActions.setTerminalState("RUNNING"));

    // Close operator auth dialog
    setShowOperatorAuthDialog(false);
  };

  // Handle job completion
  const handleJobComplete = (completedQty: number) => {
    console.log(`Job completed with quantity: ${completedQty}`);

    // Here you would typically make an API call to log the completion
    // For now, we'll just log to console
    console.log("Logging job completion:", {
      terminalId: state.terminal.terminalId,
      jobId: state.currentJob?.route_card,
      operatorName: state.terminal.loggedInUser,
      completedQty: completedQty,
      timestamp: new Date().toISOString(),
    });

    // Clear user
    dispatch(terminalActions.setLoggedInUser(null));
    localStorage.removeItem("loggedUser");

    // Clear job
    dispatch(terminalActions.resetJob());

    // Reset terminal state
    dispatch(terminalActions.setTerminalState("IDLE"));

    // Close completion dialog
    setShowCompletionDialog(false);
  };

  const handleAbandon = () => {
    // Clear user
    dispatch(terminalActions.setLoggedInUser(null));
    localStorage.removeItem("loggedUser");

    // Clear job
    dispatch(terminalActions.resetJob());

    // Reset terminal state
    dispatch(terminalActions.setTerminalState("IDLE"));
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {/* Setup Complete button - now triggers inspection process */}
        {terminalState === "SETUP" && (
          <Button
            onClick={handleSetupComplete}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Setup Complete
          </Button>
        )}

        {/* Running Complete button - now opens completion dialog */}
        {terminalState === "RUNNING" && (
          <Button
            onClick={() => setShowCompletionDialog(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Running Complete
          </Button>
        )}

        {/* Inspect button */}
        {terminalState === "RUNNING" && (
          <Button
            onClick={() =>
              dispatch(terminalActions.setTerminalState("INSPECTION_REQUIRED"))
            }
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Inspect
          </Button>
        )}

        {/* Pause button */}
        {terminalState === "RUNNING" && (
          <Button
            onClick={() => dispatch(terminalActions.setTerminalState("PAUSED"))}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Pause
          </Button>
        )}

        {/* Resume button */}
        {terminalState === "PAUSED" && (
          <Button
            onClick={() =>
              dispatch(terminalActions.setTerminalState("RUNNING"))
            }
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

      {/* Inspection Dialog */}
      {showInspectionDialog && (
        <InspectionDialog
          inspectionType="1st_off"
          onComplete={handleInspectionComplete}
          onCancel={() => setShowInspectionDialog(false)}
        />
      )}

      {/* Operator Authentication Dialog */}
      {showOperatorAuthDialog && (
        <OperatorAuthDialog
          onAuthenticated={handleOperatorAuthenticated}
          onCancel={() => setShowOperatorAuthDialog(false)}
        />
      )}

      {/* Job Completion Dialog */}
      {showCompletionDialog && (
        <CompletionDialog
          onComplete={handleJobComplete}
          onCancel={() => setShowCompletionDialog(false)}
        />
      )}
    </>
  );
}
