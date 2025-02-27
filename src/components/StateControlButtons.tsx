// src/components/StateControlButtons.tsx
import { useState } from "react";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { Button } from "@/components/ui/button";
import InspectionDialog from "@/components/InspectionDialog";
import OperatorAuthDialog from "@/components/OperatorAuthDialog";
import CompletionDialog from "@/components/CompletionDialog";
import PauseDialog from "./PauseDialog";
import AbandonDialog from "./AbandonDialog";
import { abandonJob } from "@/utils/jobLogs";

export default function StateControlButtons() {
  const { state, dispatch } = useTerminal();
  const { terminalState } = state.terminal;

  // State for dialog visibility
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [showOperatorAuthDialog, setShowOperatorAuthDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [inspectionType, setInspectionType] = useState<
    "1st_off" | "in_process"
  >("1st_off");

  // Track the authenticated employee ID for logging purposes
  const [authenticatedEmployeeId, setAuthenticatedEmployeeId] =
    useState<string>("");

  // Don't render if no job is loaded
  if (!state.currentJob) return null;

  // Handle setup complete button - triggers first-off inspection
  const handleSetupComplete = () => {
    // Show inspection dialog for first-off inspection
    setInspectionType("1st_off");
    setShowInspectionDialog(true);
  };

  // Handle inspection completion
  const handleInspectionComplete = (
    passed: boolean,
    inspector: string,
    comments: string
  ) => {
    console.log(
      `${
        inspectionType === "1st_off" ? "First-off" : "In-process"
      } inspection ${passed ? "passed" : "failed"} by ${inspector}`
    );
    console.log("Comments:", comments);

    // Close inspection dialog
    setShowInspectionDialog(false);

    if (passed) {
      if (inspectionType === "1st_off") {
        // First-off inspection passed - update terminal state to INSPECTION_REQUIRED
        // Note: The setup log is completed inside InspectionDialog when inspection passes
        dispatch(terminalActions.setTerminalState("INSPECTION_REQUIRED"));
      }

      // For in-process inspection that passes, we don't need to change anything
      // Show operator authentication dialog if first-off inspection passed
      if (inspectionType === "1st_off") {
        setShowOperatorAuthDialog(true);
      }
    } else {
      // Failed inspection handling
      if (inspectionType === "in_process") {
        // For in-process inspection failures, stay in RUNNING state
        alert(
          "In-process inspection failed. Please correct the issues and try again."
        );
      } else {
        // For first-off inspection failures, update terminal state back to SETUP
        // The setup log is NOT ended - keeping it active for the next inspection attempt
        dispatch(terminalActions.setTerminalState("SETUP"));
        alert(
          "First-off inspection failed. Please correct the setup issues and try again."
        );
      }
    }
  };

  // Handle operator authentication
  const handleOperatorAuthenticated = (
    operatorName: string,
    operatorId: string
  ) => {
    // Store the employee ID for future use
    setAuthenticatedEmployeeId(operatorId);

    // Update terminal with operator name
    dispatch(terminalActions.setLoggedInUser(operatorName));

    // Change state to RUNNING
    dispatch(terminalActions.setTerminalState("RUNNING"));

    // Close operator auth dialog
    setShowOperatorAuthDialog(false);

    // Reset resume flag
    setIsResuming(false);
  };

  // Handle job completion
  const handleJobComplete = (completedQty: number) => {
    console.log(`Job completed with quantity: ${completedQty}`);

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

  // Handle pause operation
  const handlePause = (pauseReason: string) => {
    console.log(`Pausing operation with reason: ${pauseReason}`);

    // Log out the current user
    dispatch(terminalActions.setLoggedInUser(null));
    localStorage.removeItem("loggedUser");

    // Change terminal state to PAUSED
    dispatch(terminalActions.setTerminalState("PAUSED"));

    // Close the pause dialog
    setShowPauseDialog(false);
  };

  // Handle resume operation
  const handleResume = () => {
    // Set resuming flag for OperatorAuthDialog
    setIsResuming(true);

    // Show operator authentication dialog
    setShowOperatorAuthDialog(true);
  };

  // Handle job abandonment
  const handleAbandon = async (completedQty: number, reason: string) => {
    console.log(
      `Abandoning job with reason: ${reason}, completed qty: ${completedQty}`
    );

    try {
      // Close active log based on current state
      if (state.activeLogId && state.activeLogState) {
        const logResult = await abandonJob(
          state.activeLogId,
          state.activeLogState,
          completedQty,
          reason
        );

        if (!logResult.success) {
          console.error("Failed to log job abandonment:", logResult.error);
        }
      }

      // Clear user
      dispatch(terminalActions.setLoggedInUser(null));
      localStorage.removeItem("loggedUser");

      // Clear job and active log tracking
      dispatch(terminalActions.resetJob());
      dispatch(terminalActions.clearActiveLog());

      // Reset terminal state
      dispatch(terminalActions.setTerminalState("IDLE"));

      // Close the dialog
      setShowAbandonDialog(false);
    } catch (error) {
      console.error("Error during job abandonment:", error);
    }
  };

  // Initial abandon button handler - now decides whether to show dialog based on state
  const handleAbandonClick = () => {
    if (!state.activeLogId || !state.activeLogState) {
      // No active log, just reset everything
      dispatch(terminalActions.setLoggedInUser(null));
      localStorage.removeItem("loggedUser");
      dispatch(terminalActions.resetJob());
      dispatch(terminalActions.setTerminalState("IDLE"));
      return;
    }

    // Determine if we need quantity input (only for RUNNING state)
    const requireQty = state.activeLogState === "RUNNING";

    // Show the abandon dialog
    setShowAbandonDialog(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {/* Setup Complete button - triggers first-off inspection process */}
        {terminalState === "SETUP" && (
          <Button
            onClick={handleSetupComplete}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Setup Complete
          </Button>
        )}

        {/* Running Complete button - opens completion dialog */}
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
            onClick={() => {
              setInspectionType("in_process");
              setShowInspectionDialog(true);
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Inspect
          </Button>
        )}

        {/* Pause button - now opens pause dialog */}
        {terminalState === "RUNNING" && (
          <Button
            onClick={() => setShowPauseDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Pause
          </Button>
        )}

        {/* Resume button - now triggers authentication flow */}
        {terminalState === "PAUSED" && (
          <Button
            onClick={handleResume}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Resume
          </Button>
        )}

        {/* In-process Inspection button for INSPECTION_REQUIRED state */}
        {terminalState === "INSPECTION_REQUIRED" && (
          <Button
            onClick={() => {
              setInspectionType("in_process");
              setShowInspectionDialog(true);
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            Perform Inspection
          </Button>
        )}

        {/* Abandon Button - Updated to properly handle and log abandonment */}
        <Button
          onClick={handleAbandonClick}
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
          inspectionType={inspectionType}
          onComplete={handleInspectionComplete}
          onCancel={() => setShowInspectionDialog(false)}
        />
      )}

      {/* Operator Authentication Dialog */}
      {showOperatorAuthDialog && (
        <OperatorAuthDialog
          onAuthenticated={handleOperatorAuthenticated}
          onCancel={() => {
            setShowOperatorAuthDialog(false);
            setIsResuming(false);
          }}
          isResume={isResuming}
        />
      )}

      {/* Job Completion Dialog */}
      {showCompletionDialog && (
        <CompletionDialog
          onComplete={handleJobComplete}
          onCancel={() => setShowCompletionDialog(false)}
        />
      )}

      {/* Pause Dialog */}
      {showPauseDialog && (
        <PauseDialog
          onPause={handlePause}
          onCancel={() => setShowPauseDialog(false)}
          employeeId={authenticatedEmployeeId} // Pass the stored employee ID
        />
      )}

      {/* Abandon Dialog */}
      {showAbandonDialog && (
        <AbandonDialog
          onAbandon={handleAbandon}
          onCancel={() => setShowAbandonDialog(false)}
          requireQty={state.activeLogState === "RUNNING"}
        />
      )}
    </>
  );
}
