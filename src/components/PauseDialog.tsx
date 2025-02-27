// src/components/PauseDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { pauseJob } from "@/utils/jobLogs";
import { updateJobCompletion } from "@/utils/jobUpdates";

type PauseDialogProps = {
  onPause: (reason: string, updatedJob?: any) => void;
  onCancel: () => void;
  employeeId?: string;
};

export default function PauseDialog({
  onPause,
  onCancel,
  employeeId = "",
}: PauseDialogProps) {
  const { state, dispatch } = useTerminal();
  const [reason, setReason] = useState<string>("");
  const [completedQty, setCompletedQty] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLogging, setIsLogging] = useState<boolean>(false);

  const handlePause = async () => {
    // Validate input
    if (!reason.trim()) {
      setError("Please enter a reason for pausing");
      return;
    }

    const qty = parseInt(completedQty);
    if (isNaN(qty) || qty < 0) {
      setError("Please enter a valid quantity (0 or greater)");
      return;
    }

    setIsLogging(true);
    setError("");

    try {
      // If we have an active running log, update it and create a paused log
      if (
        state.activeLogId &&
        state.activeLogState === "RUNNING" &&
        state.currentJob
      ) {
        // Use the employeeId prop instead of the user name
        const operatorId = employeeId || "unknown";

        const logResult = await pauseJob(
          state.activeLogId,
          qty,
          state.currentJob,
          state.terminal,
          operatorId,
          reason
        );

        if (!logResult.success) {
          console.error("Failed to log pause:", logResult.error);
          setError("Failed to log pause data. Please try again.");
          setIsLogging(false);
          return;
        }

        // Update active log to the pause log
        if (logResult.paused_log_id) {
          dispatch(
            terminalActions.setActiveLog(logResult.paused_log_id, "PAUSED")
          );
        }

        // Update the job in the database if quantity > 0
        let updatedJobData = null;
        if (qty > 0 && state.currentJob) {
          const jobResult = await updateJobCompletion(state.currentJob, qty);

          if (!jobResult.success) {
            console.error("Failed to update job:", jobResult.error);
            // Don't block the pause flow for job update failures
            console.warn("Job update failed, but pause was successful");
          } else {
            console.log("Job updated successfully:", jobResult.updatedJob);
            updatedJobData = jobResult.updatedJob;

            // Update the current job in state with new balance and completed_qty
            if (updatedJobData && state.currentJob) {
              const updatedJob = {
                ...state.currentJob,
                completed_qty:
                  updatedJobData.completed_qty ||
                  state.currentJob.completed_qty,
                balance: updatedJobData.balance || state.currentJob.balance,
                status: updatedJobData.status || state.currentJob.status,
              };

              // Update the current job in state
              dispatch(terminalActions.setCurrentJob(updatedJob));
            }
          }
        }
      } else {
        console.warn("No active running log found for pause");
      }

      // Call the onPause callback with the reason
      onPause(reason);
    } catch (error) {
      console.error("Error logging pause:", error);
      setError("An error occurred. Please try again.");
      setIsLogging(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePause();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Pause Operation</h2>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Completed Before Pausing:
            </label>
            <Input
              type="number"
              min="0"
              placeholder="Enter completed quantity"
              value={completedQty}
              onChange={(e) => setCompletedQty(e.target.value)}
              className="w-full mb-4"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Pausing:
            </label>
            <textarea
              className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason for pausing operation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={handlePause}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLogging}
            >
              {isLogging ? "Logging..." : "Pause Operation"}
            </Button>
            <Button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
              disabled={isLogging}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
