import { useState } from "react";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { Button } from "@/components/ui/button";
import InspectionDialog from "@/components/InspectionDialog";
import OperatorAuthDialog from "@/components/OperatorAuthDialog";
import CompletionDialog from "@/components/CompletionDialog";
import PauseDialog from "./PauseDialog";

export default function StateControlButtons() {
  const { state, dispatch } = useTerminal();
  const { terminalState } = state.terminal;

  // State for dialog visibility
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [showOperatorAuthDialog, setShowOperatorAuthDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [inspectionType, setInspectionType] = useState<
    "1st_off" | "in_process"
  >("1st_off");

  // Don't render if no job is loaded
  if (!state.currentJob) return null;

  // Handle setup complete button
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
    // Log inspection details (in a real app, this would be an API call)
    console.log(
      `${
        inspectionType === "1st_off" ? "First-off" : "In-process"
      } inspection ${passed ? "passed" : "failed"} by ${inspector}`
    );
    console.log("Comments:", comments);

    // Close inspection dialog
    setShowInspectionDialog(false);

    if (passed) {
      // Show operator authentication dialog
      setShowOperatorAuthDialog(true);
    } else {
      // Failed inspection handling
      if (inspectionType === "in_process") {
        // For in-process inspection failures, stay in INSPECTION_REQUIRED state
        alert(
          "In-process inspection failed. Please correct the issues and try again."
        );
      } else {
        // For first-off inspection failures, stay in SETUP state
        alert(
          "First-off inspection failed. Please correct the setup issues and try again."
        );
      }
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

  // Handle pause operation
  const handlePause = (reason: string) => {
    // Log pause reason (in a real app, this would be an API call)
    console.log("Pausing operation. Reason:", reason);

    // Log the pause event with the current user
    console.log("Logging pause:", {
      terminalId: state.terminal.terminalId,
      jobId: state.currentJob?.route_card,
      operatorName: state.terminal.loggedInUser,
      reason: reason,
      timestamp: new Date().toISOString(),
    });

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
    // Show operator authentication dialog
    setShowOperatorAuthDialog(true);

    // After successful authentication, the operator will be logged in
    // and the terminal state will change to INSPECTION_REQUIRED
    // This is handled in the handleOperatorAuthenticated function with a slight modification
  };

  // Override operator authenticated for resume workflow
  const handleResumeOperatorAuthenticated = (operatorName: string) => {
    // Update terminal with operator name
    dispatch(terminalActions.setLoggedInUser(operatorName));

    // Change state to INSPECTION_REQUIRED instead of RUNNING for the resume workflow
    dispatch(terminalActions.setTerminalState("INSPECTION_REQUIRED"));

    // Close operator auth dialog
    setShowOperatorAuthDialog(false);
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

  // Determine which operator auth handler to use based on terminal state
  const operatorAuthHandler =
    terminalState === "PAUSED"
      ? handleResumeOperatorAuthenticated
      : handleOperatorAuthenticated;

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
          inspectionType={inspectionType}
          onComplete={handleInspectionComplete}
          onCancel={() => setShowInspectionDialog(false)}
        />
      )}

      {/* Operator Authentication Dialog */}
      {showOperatorAuthDialog && (
        <OperatorAuthDialog
          onAuthenticated={operatorAuthHandler}
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

      {/* Pause Dialog */}
      {showPauseDialog && (
        <PauseDialog
          onPause={handlePause}
          onCancel={() => setShowPauseDialog(false)}
        />
      )}
    </>
  );
}
