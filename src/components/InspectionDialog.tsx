// src/components/InspectionDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authenticateUser } from "@/utils/authenticateUser";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { completeInspection, completeSetupLog } from "@/utils/jobLogs";
import { EfficiencyMetrics } from "@/utils/efficiencyCalculator";
import { getEfficiencyForJobLog } from "@/utils/efficiencyLogger";
import EfficiencyDisplay from "./EfficiencyDisplay";

type InspectionType = "1st_off" | "in_process";

type InspectionDialogProps = {
  inspectionType: InspectionType;
  onComplete: (passed: boolean, inspector: string, comments: string) => void;
  onCancel: () => void;
};

export default function InspectionDialog({
  inspectionType,
  onComplete,
  onCancel,
}: InspectionDialogProps) {
  const { state, dispatch } = useTerminal();
  const [step, setStep] = useState<"auth" | "inspection">("auth");
  const [employeeId, setEmployeeId] = useState("");
  const [comments, setComments] = useState("");
  const [inspectionQty, setInspectionQty] = useState<string>("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inspector, setInspector] = useState("");
  const [inspectionLogId, setInspectionLogId] = useState<number | null>(null);

  // For efficiency display
  const [showEfficiency, setShowEfficiency] = useState<boolean>(false);
  const [efficiencyMetrics, setEfficiencyMetrics] =
    useState<EfficiencyMetrics | null>(null);
  const [inspectionPassed, setInspectionPassed] = useState<boolean>(false);

  const handleInspectorScan = async () => {
    if (!employeeId.trim()) {
      setError("Please enter an employee ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await authenticateUser(employeeId, "can_inspect");

      if (!result.success) {
        setError(result.error || "Authentication failed");
        setLoading(false);
        return;
      }

      // Set inspector name
      setInspector(result.name || "");

      // Handle different log creation based on inspection type
      if (
        inspectionType === "1st_off" &&
        state.activeLogId &&
        state.activeLogState === "SETUP"
      ) {
        // For first-off inspection, we're starting inspection but NOT completing setup yet
        // We'll only complete setup if inspection passes

        // Create inspection log without ending the setup log
        const lookup_code = `${state.currentJob?.route_card}-${state.currentJob?.contract_number}-${state.currentJob?.op_code}`;

        const response = await fetch("/api/logs/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lookup_code,
            user_id: employeeId,
            machine_id: state.terminal.terminalId,
            state: "INSPECTION",
            inspection_type: "1st_off",
            start_time: new Date().toISOString(),
          }),
        });

        const data = await response.json();

        if (data.success && data.log_id) {
          setInspectionLogId(data.log_id);
          // We keep the activeLogId as the SETUP log but track our inspection log separately
        } else {
          console.error("Failed to create inspection log:", data.error);
          setError("Failed to create inspection log. Please try again.");
          setLoading(false);
          return;
        }
      } else if (inspectionType === "in_process" && state.currentJob) {
        // For in-process inspections, create a standalone inspection log
        const lookup_code = `${state.currentJob.route_card}-${state.currentJob.contract_number}-${state.currentJob.op_code}`;

        const response = await fetch("/api/logs/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lookup_code,
            user_id: employeeId,
            machine_id: state.terminal.terminalId,
            state: "INSPECTION",
            inspection_type: "in_process",
            start_time: new Date().toISOString(),
          }),
        });

        const data = await response.json();

        if (data.success && data.log_id) {
          setInspectionLogId(data.log_id);
          // We don't change activeLogId for in-process inspections
          // since the RUNNING log should still be active
        } else {
          console.error("Failed to create inspection log:", data.error);
          setError("Failed to create inspection log. Please try again.");
          setLoading(false);
          return;
        }
      }

      // Move to inspection step
      setStep("inspection");
    } catch (error) {
      console.error("Authentication Error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
      setEmployeeId("");
    }
  };

  const handleInspectionPass = async () => {
    setInspectionPassed(true);
    setLoading(true);

    if (inspectionLogId) {
      // Complete the inspection log
      await completeInspection(
        inspectionLogId,
        true, // passed
        comments,
        inspectionType === "in_process" ? Number(inspectionQty) || 1 : 1
      );

      // If this was a first-off inspection that passed, end the setup log and log efficiency
      if (
        inspectionType === "1st_off" &&
        state.activeLogId &&
        state.activeLogState === "SETUP" &&
        state.currentJob
      ) {
        try {
          console.log("Completing setup log after inspection pass");

          // Complete the setup log and log efficiency
          const setupResult = await completeSetupLog(
            state.activeLogId,
            state.currentJob,
            `Setup passed inspection by ${inspector}. ${comments}`
          );

          console.log("Setup completion result:", setupResult);

          if (setupResult.success) {
            // Get efficiency metrics directly from the completed setup log
            if (setupResult.efficiencyMetrics) {
              console.log(
                "Setup efficiency metrics available:",
                setupResult.efficiencyMetrics
              );
              setEfficiencyMetrics(setupResult.efficiencyMetrics);
              setShowEfficiency(true);
            } else {
              console.warn(
                "No efficiency metrics returned from completeSetupLog"
              );

              // Fallback to fetching from the API if needed
              const efficiencyResult = await getEfficiencyForJobLog(
                state.activeLogId
              );

              if (
                efficiencyResult.success &&
                efficiencyResult.efficiencyMetrics
              ) {
                console.log(
                  "Fetched efficiency metrics from API:",
                  efficiencyResult.efficiencyMetrics
                );
                setEfficiencyMetrics(efficiencyResult.efficiencyMetrics);
                setShowEfficiency(true);
              } else {
                console.warn("No efficiency metrics found");
                finishInspectionPass();
              }
            }
          } else {
            console.error("Failed to complete setup log:", setupResult.error);
            finishInspectionPass();
          }
        } catch (error) {
          console.error("Error during setup completion:", error);
          finishInspectionPass();
        }
      } else {
        // Not a first-off inspection or no active setup log
        finishInspectionPass();
      }
    } else {
      // No inspection log created
      finishInspectionPass();
    }
  };

  const finishInspectionPass = () => {
    // Update terminal state to inspection required for first-off inspections
    if (inspectionType === "1st_off") {
      dispatch(terminalActions.setTerminalState("INSPECTION_REQUIRED"));
    }

    setLoading(false);

    // Only call onComplete if we're not showing efficiency
    if (!showEfficiency) {
      onComplete(true, inspector, comments);
    }
  };

  const handleEfficiencyClose = () => {
    console.log("Efficiency display closed");
    setShowEfficiency(false);

    // Update terminal state after efficiency display is closed
    if (inspectionType === "1st_off") {
      dispatch(terminalActions.setTerminalState("INSPECTION_REQUIRED"));
    }

    // Now complete the inspection process
    onComplete(true, inspector, comments);
  };

  const handleInspectionFail = async () => {
    if (inspectionLogId) {
      // Complete the inspection log with fail status
      await completeInspection(
        inspectionLogId,
        false, // failed
        comments,
        inspectionType === "in_process" ? Number(inspectionQty) || 1 : 1
      );

      // For failed first-off inspections, we keep the setup log active (don't end it)
      // This allows for another inspection after corrections are made
    }

    // Call the onComplete handler from parent component
    onComplete(false, inspector, comments);
  };

  // Handle Enter key press for scanner
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === "auth") {
      handleInspectorScan();
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
          <CardContent className="flex flex-col items-center space-y-4">
            {step === "auth" ? (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {inspectionType === "1st_off"
                    ? "First-Off Inspection"
                    : "In-Process Inspection"}{" "}
                  Required
                </h2>
                <p className="text-center mb-4">
                  Please scan inspector ID to verify and inspect the{" "}
                  {inspectionType === "1st_off" ? "setup" : "production"}
                </p>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Input
                  type="text"
                  placeholder="Scan or Enter Inspector ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  autoFocus
                  className="w-full"
                />

                <div className="flex space-x-4 w-full justify-center mt-4">
                  <Button
                    onClick={handleInspectorScan}
                    disabled={loading}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {loading ? "Verifying..." : "Verify Inspector"}
                  </Button>
                  <Button
                    onClick={onCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">
                  {inspectionType === "1st_off"
                    ? "First-Off Inspection"
                    : "In-Process Inspection"}
                </h2>
                <p className="text-center mb-2">
                  Inspector: <span className="font-semibold">{inspector}</span>
                </p>

                <div className="w-full">
                  {inspectionType === "in_process" && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inspection Quantity:
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={inspectionQty}
                        onChange={(e) => setInspectionQty(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Inspection Comments:
                  </label>
                  <textarea
                    className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter inspection comments, observations, or issues..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex space-x-4 w-full justify-center mt-4">
                  <Button
                    onClick={handleInspectionPass}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Pass Inspection"}
                  </Button>
                  <Button
                    onClick={handleInspectionFail}
                    className="bg-red-500 hover:bg-red-600 text-white"
                    disabled={loading}
                  >
                    Fail Inspection
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Display */}
      {showEfficiency && efficiencyMetrics && (
        <EfficiencyDisplay
          metrics={efficiencyMetrics}
          process="Setup"
          onClose={handleEfficiencyClose}
        />
      )}
    </>
  );
}
