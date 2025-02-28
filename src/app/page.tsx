"use client";

import { useState, useEffect } from "react";
import TerminalLogin from "@/components/TerminalLogin";
import TerminalInfo from "@/components/TerminalInfo";
import ScanJobDialog from "@/components/ScanJobDialog";
import JobDetailsCard from "@/components/JobDetailsCard";
import ScanUserDialog from "@/components/ScanUserDialog";
import StateControlButtons from "@/components/StateControlButtons";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";

export default function HomePage() {
  const { state, dispatch } = useTerminal();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [userDialogRole, setUserDialogRole] = useState<
    "can_operate" | "can_setup" | "can_inspect" | "can_remanufacture"
  >("can_setup");

  // Determine when to show user authentication dialog
  useEffect(() => {
    // If we have a job but no user, and we're in IDLE state, prompt for setter authentication
    if (
      state.currentJob &&
      !state.terminal.loggedInUser &&
      state.terminal.terminalState === "IDLE"
    ) {
      setUserDialogRole("can_setup");
      setShowUserDialog(true);
    } else {
      // Close the dialog if we now have a logged in user or if the state is no longer IDLE
      setShowUserDialog(false);
    }
  }, [
    state.currentJob,
    state.terminal.loggedInUser,
    state.terminal.terminalState,
  ]);

  // Handle user dialog cancellation
  const handleUserDialogCancel = () => {
    setShowUserDialog(false);
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 gap-y-6">
      {/* Show login if not authenticated */}
      {!state.terminal.terminalId ? (
        <TerminalLogin />
      ) : (
        <>
          {/* Terminal Info (always shown when logged in) */}
          <TerminalInfo />

          {/* Job Scanning (shown in IDLE state) */}
          <ScanJobDialog />

          {/* Job Details (shown when job is loaded) */}
          <JobDetailsCard />

          {/* State Control Buttons */}
          <StateControlButtons />

          {/* User Authentication Dialog (conditionally shown) */}
          {showUserDialog && (
            <ScanUserDialog
              roleRequired={userDialogRole}
              onCancel={handleUserDialogCancel}
              onAuthenticated={(name) => {
                // Update terminal with authenticated user
                dispatch(terminalActions.setLoggedInUser(name));

                // Close the dialog
                setShowUserDialog(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
