// src/components/CompletionDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { completeRunningLog } from "@/utils/jobLogs";
import { updateJobCompletion } from "@/utils/jobUpdates";
import { EfficiencyMetrics } from "@/utils/efficiencyCalculator";
import { logEfficiency } from "@/utils/efficiencyLogger";
import EfficiencyDisplay from "./EfficiencyDisplay";
// Import RejectFlowController component
import RejectFlowController from "./RejectFlowController";
// Import RejectData type from rejectService
import { RejectData } from "@/utils/rejectService";

type CompletionDialogProps = {
  onComplete: (completedQty: number) => void;
  onCancel: () => void;
};

export default function CompletionDialog({
  onComplete,
  onCancel,
}: CompletionDialogProps) {
  const { state, dispatch } = useTerminal();
  const [completedQty, setCompletedQty] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [showEfficiency, setShowEfficiency] = useState<boolean>(false);
  const [efficiencyMetrics, setEfficiencyMetrics] =
    useState<EfficiencyMetrics | null>(null);
  const [completionQty, setCompletionQty] = useState<number | null>(null);

  // New states for the reject flow
  const [showRejectFlow, setShowRejectFlow] = useState<boolean>(false);
  const [validatedQty, setValidatedQty] = useState<number>(0);

  const handleComplete = async () => {
    // Validate input
    if (!completedQty.trim()) {
      setError("Please enter a quantity");
      return;
    }

    const qty = parseInt(completedQty);

    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    if (state.currentJob && qty > state.currentJob.balance) {
      setError(
        `Quantity cannot exceed the current balance (${state.currentJob.balance})`
      );
      return;
    }

    // Store the validated quantity
    setValidatedQty(qty);

    // Check if there will be a remaining balance (trigger reject flow)
    if (state.currentJob && qty < state.currentJob.balance) {
      // Start the reject flow
      setShowRejectFlow(true);
      return; // Don't proceed with completion yet
    }

    // If no reject flow needed, continue with normal completion
    proceedWithCompletion(qty);
  };

  // This function handles the regular job completion (after validation and possible reject flow)
  const proceedWithCompletion = async (qty: number) => {
    setIsLogging(true);
    setError("");

    try {
      // If we have an active running log, update it
      if (
        state.activeLogId &&
        state.activeLogState === "RUNNING" &&
        state.currentJob
      ) {
        // Get the job log first to get its start time
        const jobLogResponse = await fetch(
          `/api/logs/jobs?log_id=${state.activeLogId}`
        );
        const jobLogData = await jobLogResponse.json();

        if (!jobLogResponse.ok || !jobLogData.success) {
          console.error("Failed to fetch job log data:", jobLogData.error);
          setError("Failed to fetch log data. Please try again.");
          setIsLogging(false);
          return;
        }

        const jobLog = jobLogData.log;
        const operatorId = jobLog.user_id as string;
        const machineId = state.terminal.terminalId?.toString();

        if (!jobLog) {
          console.error("No job log found");
          setError("Failed to fetch log data. Please try again.");
          setIsLogging(false);
          return;
        }

        // Complete the running log
        const endTime = new Date();
        const logResult = await completeRunningLog(state.activeLogId, qty);

        if (!logResult.success) {
          console.error("Failed to complete running log:", logResult.error);
          setError("Failed to log completion data. Please try again.");
          setIsLogging(false);
          return;
        }

        // Calculate and log efficiency metrics
        const lookupCode = `${state.currentJob.route_card}-${state.currentJob.contract_number}-${state.currentJob.op_code}`;
        const efficiencyResult = await logEfficiency({
          jobLogId: state.activeLogId,
          lookupCode,
          logType: "RUNNING",
          startTime: jobLog.start_time,
          endTime: endTime.toISOString(),
          jobData: state.currentJob,
          quantity: qty,
          operatorId,
          machineId,
        });

        if (efficiencyResult.success && efficiencyResult.efficiencyMetrics) {
          setEfficiencyMetrics(efficiencyResult.efficiencyMetrics);
          // Save the completion quantity for later
          setCompletionQty(qty);
          // Show the efficiency display
          setShowEfficiency(true);
        } else {
          console.error("Failed to log efficiency:", efficiencyResult.error);
          // If efficiency logging fails, still continue with the completion
          finalizeCompletion(qty);
        }

        // Clear active log in context
        dispatch(terminalActions.clearActiveLog());
      } else {
        console.warn("No active running log found for completion");
        // If no active log, just complete without efficiency
        finalizeCompletion(qty);
      }

      // Update the job in the database
      if (state.currentJob) {
        const jobResult = await updateJobCompletion(state.currentJob, qty);

        if (!jobResult.success) {
          console.error("Failed to update job:", jobResult.error);
          setError("Failed to update job data. Please try again.");
          setIsLogging(false);
          return;
        }

        console.log("Job updated successfully:", jobResult.updatedJob);
      }
    } catch (error) {
      console.error("Completion Error:", error);
      setError("An error occurred. Please try again.");
      setIsLogging(false);
    } finally {
      if (!showEfficiency) {
        setIsLogging(false);
      }
    }
  };

  // Final step to call the parent component's onComplete
  const finalizeCompletion = (qty: number) => {
    onComplete(qty);
  };

  const handleEfficiencyClose = () => {
    console.log("Efficiency display close requested");
    setShowEfficiency(false);
    setIsLogging(false);

    // Only call onComplete if we have a saved completion quantity
    if (completionQty !== null) {
      finalizeCompletion(completionQty);
    } else {
      // Fallback to the parsed input value if somehow completionQty wasn't set
      finalizeCompletion(parseInt(completedQty));
    }
  };

  // Handle completion of reject flow
  const handleRejectFlowComplete = (rejectData?: RejectData) => {
    console.log("Reject flow completed:", rejectData);
    setShowRejectFlow(false);

    // If reject data exists, it means the reject was successfully created
    if (rejectData) {
      // Log the reject data for debugging
      console.log("Remanufacture request created:", rejectData);
    }

    // Continue with regular job completion
    proceedWithCompletion(validatedQty);
  };

  // Handle cancel of reject flow
  const handleRejectFlowCancel = () => {
    console.log("Reject flow cancelled");
    setShowRejectFlow(false);
    setIsLogging(false);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleComplete();
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
          <CardContent className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-bold mb-4">Job Completion</h2>

            <div className="w-full space-y-2">
              <p className="text-gray-700">
                Job:{" "}
                <span className="font-semibold">
                  {state.currentJob?.part_number}
                </span>
              </p>
              <p className="text-gray-700">
                Required Quantity:{" "}
                <span className="font-semibold">
                  {state.currentJob?.quantity}
                </span>
              </p>
              <p className="text-gray-700">
                Balance:{" "}
                <span className="font-semibold">
                  {state.currentJob?.balance || state.currentJob?.quantity}
                </span>
              </p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completed Quantity:
              </label>
              <Input
                type="number"
                placeholder="Enter quantity"
                value={completedQty}
                onChange={(e) => setCompletedQty(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-full"
              />
            </div>

            <div className="flex space-x-4 w-full justify-center mt-4">
              <Button
                onClick={handleComplete}
                className="bg-green-500 hover:bg-green-600 text-white"
                disabled={isLogging}
              >
                {isLogging ? "Logging..." : "Complete Job"}
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

      {/* Efficiency Display */}
      {showEfficiency && efficiencyMetrics && (
        <EfficiencyDisplay
          metrics={efficiencyMetrics}
          process="Running"
          onClose={handleEfficiencyClose}
        />
      )}

      {/* Reject Flow */}
      {showRejectFlow && state.currentJob && state.terminal && (
        <RejectFlowController
          jobData={state.currentJob}
          completedQuantity={validatedQty}
          terminalData={state.terminal}
          operatorId={state.terminal.loggedInUser || ""}
          operatorName={state.terminal.loggedInUser || ""}
          onComplete={handleRejectFlowComplete}
          onCancel={handleRejectFlowCancel}
        />
      )}
    </>
  );
}
