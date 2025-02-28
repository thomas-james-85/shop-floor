// src/components/StateControlButtons.tsx
import { useState } from "react";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { Button } from "@/components/ui/button";
import InspectionDialog from "@/components/InspectionDialog";
import OperatorAuthDialog from "@/components/OperatorAuthDialog";
import CompletionDialog from "@/components/CompletionDialog";
import PauseDialog from "./PauseDialog";
import AbandonDialog from "./AbandonDialog";
import { updateJobCompletion } from "@/utils/jobUpdates";
import { abandonJob } from "@/utils/jobLogs";
import { refreshJobData } from "@/utils/refreshJob";

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

  // Function to fetch the latest job data
  const fetchLatestJobData = async () => {
    if (!state.currentJob || !state.terminal.operationCode) return;

    try {
      const updatedJob = await refreshJobData(state.currentJob, state.terminal);

      if (updatedJob) {
        // Update current job with the latest data from server
        dispatch(terminalActions.setCurrentJob(updatedJob));
        console.log("Updated job data:", updatedJob);
      } else {
        console.error("Failed to refresh job data");
      }
    } catch (error) {
      console.error("Error refreshing job data:", error);
    }
  };

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

    // Fetch latest job data to ensure we have up-to-date values
    fetchLatestJobData();
  };

  // Handle job completion
  const handleJobComplete = async (completedQty: number) => {
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
  const handleAbandon = async (completedQty: number, abandonReason: string) => {
    console.log(`Abandoning job with reason: ${abandonReason}`);
    console.log(`Completed quantity: ${completedQty}`);

    try {
      // If we have an active log, mark it as abandoned
      if (state.activeLogId && state.activeLogState && state.currentJob) {
        // Complete the active log with abandonment
        await abandonJob(
          state.activeLogId,
          state.activeLogState,
          state.currentJob,
          completedQty > 0 ? completedQty : undefined,
          abandonReason
        );

        // Update the job in the database if quantity > 0
        if (completedQty > 0) {
          await updateJobCompletion(state.currentJob, completedQty);
        }
      }
    } catch (error) {
      console.error("Error during job abandonment:", error);
    }

    // Clear user
    dispatch(terminalActions.setLoggedInUser(null));
    localStorage.removeItem("loggedUser");

    // Clear job and active log
    dispatch(terminalActions.resetJob());
    dispatch(terminalActions.clearActiveLog());

    // Reset terminal state
    dispatch(terminalActions.setTerminalState("IDLE"));

    // Close abandon dialog
    setShowAbandonDialog(false);
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

        {/* Pause button - opens pause dialog */}
        {terminalState === "RUNNING" && (
          <Button
            onClick={() => setShowPauseDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Pause
          </Button>
        )}

        {/* Resume button - triggers authentication flow */}
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

        {/* Abandon Button - Opens abandon dialog */}
        <Button
          onClick={() => setShowAbandonDialog(true)}
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
          employeeId={authenticatedEmployeeId}
        />
      )}

      {/* Abandon Dialog */}
      {showAbandonDialog && (
        <AbandonDialog
          onAbandon={handleAbandon}
          onCancel={() => setShowAbandonDialog(false)}
          requireQty={terminalState === "RUNNING" || terminalState === "PAUSED"}
        />
      )}
    </>
  );
}
