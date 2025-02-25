"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authenticateUser } from "@/utils/authenticateUser";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";

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
  const [step, setStep] = useState<"auth" | "inspection">("auth");
  const [employeeId, setEmployeeId] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inspector, setInspector] = useState("");

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

      // Set inspector name and move to inspection step
      setInspector(result.name || "");
      setStep("inspection");
    } catch (error) {
      console.error("Authentication Error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
      setEmployeeId("");
    }
  };

  const handleInspectionPass = () => {
    onComplete(true, inspector, comments);
  };

  const handleInspectionFail = () => {
    onComplete(false, inspector, comments);
  };

  // Handle Enter key press for scanner
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && step === "auth") {
      handleInspectorScan();
    }
  };

  return (
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
                >
                  Pass Inspection
                </Button>
                <Button
                  onClick={handleInspectionFail}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Fail Inspection
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
