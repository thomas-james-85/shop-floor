// src/components/OperatorAuthDialog.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authenticateUser } from "@/utils/authenticateUser";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { startRunningLog, resumeJob } from "@/utils/jobLogs";

type OperatorAuthDialogProps = {
  onAuthenticated: (operatorName: string, operatorId: string) => void;
  onCancel: () => void;
  isResume?: boolean; // Flag to indicate if this is for resuming a paused job
};

export default function OperatorAuthDialog({
  onAuthenticated,
  onCancel,
  isResume = false,
}: OperatorAuthDialogProps) {
  const { state, dispatch } = useTerminal();
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to fetch the latest job data wrapped in useCallback
  const fetchLatestJobData = useCallback(async () => {
    if (!state.currentJob || !state.terminal.operationCode) return;

    try {
      // Use route_card and contract_number for more reliable job lookup
      const scan = `${state.currentJob.route_card}-${state.currentJob.contract_number}`;

      console.log("Attempting to refresh job data with:", {
        scan,
        operation_code: state.terminal.operationCode,
      });

      const response = await fetch("/api/jobs/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan,
          operation_code: state.terminal.operationCode,
        }),
      });

      const data = await response.json();

      if (response.ok && !("error" in data)) {
        // Update current job with the latest data from server
        dispatch(terminalActions.setCurrentJob(data));
        console.log("Successfully updated job data:", data);
        return data;
      } else {
        console.error("Failed to refresh job data:", data.error);

        // Log additional context about the current job
        console.warn("Current job details:", state.currentJob);

        // If we fail to fetch, just return the existing job data to prevent breaking the flow
        return state.currentJob;
      }
    } catch (error) {
      console.error("Error refreshing job data:", error);

      // Log additional context about the current job
      console.warn("Current job details:", state.currentJob);

      // Return existing job data to prevent breaking the flow
      return state.currentJob;
    }
  }, [state.currentJob, state.terminal.operationCode, dispatch]);

  useEffect(() => {
    // When resuming a job, fetch the latest job data
    if (isResume) {
      fetchLatestJobData();
    }
  }, [isResume, fetchLatestJobData]);

  const handleOperatorScan = async () => {
    if (!employeeId.trim()) {
      setError("Please enter an employee ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authenticateUser(employeeId, "can_operate");

      if (!result.success) {
        setError(result.error || "Authentication failed");
        setLoading(false);
        return;
      }

      // Refresh job data before proceeding, especially important for resume
      const latestJobData = await fetchLatestJobData();

      // If fetchLatestJobData returns undefined or null, use existing job data
      if (!latestJobData) {
        console.warn("No updated job data found, using existing job data");
      }

      // Create appropriate log entry based on context
      if (state.currentJob) {
        if (
          isResume &&
          state.activeLogId &&
          state.activeLogState === "PAUSED"
        ) {
          // Resuming from PAUSED state
          console.log("Resuming job with operator ID:", employeeId);

          const logResult = await resumeJob(
            state.activeLogId,
            state.currentJob,
            state.terminal,
            employeeId
          );

          if (logResult.success && logResult.running_log_id) {
            // Set active log
            dispatch(
              terminalActions.setActiveLog(logResult.running_log_id, "RUNNING")
            );

            // *** CHANGED: Set state to INSPECTION_REQUIRED instead of RUNNING ***
            console.log("Setting state to INSPECTION_REQUIRED after resume");
            dispatch(terminalActions.setTerminalState("INSPECTION_REQUIRED"));
          } else {
            console.error("Failed to create resume log:", logResult.error);
            setError(logResult.error || "Failed to resume job");
            setLoading(false);
            return;
          }
        } else if (!isResume) {
          // Normal transition to RUNNING after inspection
          const logResult = await startRunningLog(
            state.currentJob,
            state.terminal,
            employeeId
          );

          if (logResult.success && logResult.log_id) {
            dispatch(terminalActions.setActiveLog(logResult.log_id, "RUNNING"));
            // For normal transition after inspection, we still go directly to RUNNING
            dispatch(terminalActions.setTerminalState("RUNNING"));
          } else {
            console.error("Failed to create running log:", logResult.error);
            setError(logResult.error || "Failed to start job");
            setLoading(false);
            return;
          }
        }
      }

      // Call the onAuthenticated callback with both the operator name and ID
      onAuthenticated(result.name || "", employeeId);
    } catch (error) {
      console.error("Authentication Error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press for scanner
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleOperatorScan();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Operator Authentication</h2>
          <p className="text-center mb-4">
            {isResume
              ? "Please scan operator ID to resume production"
              : "Inspection passed! Please scan operator ID to begin production"}
          </p>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Input
            type="text"
            placeholder="Scan or Enter Operator ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
            className="w-full"
          />

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={handleOperatorScan}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {loading ? "Verifying..." : "Verify Operator"}
            </Button>
            <Button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
