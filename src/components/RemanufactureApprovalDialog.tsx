// src/components/RemanufactureApprovalDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authenticateUser } from "@/utils/authenticateUser";

type RemanufactureApprovalDialogProps = {
  onApproved: (supervisorId: string, supervisorName: string) => void;
  onCancel: () => void;
};

export default function RemanufactureApprovalDialog({
  onApproved,
  onCancel,
}: RemanufactureApprovalDialogProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSupervisorScan = async () => {
    if (!employeeId.trim()) {
      setError("Please enter a supervisor ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Authenticate user with can_remanufacture permission
      const result = await authenticateUser(employeeId, "can_remanufacture");

      if (!result.success) {
        setError(result.error || "Authentication failed");
        setLoading(false);
        return;
      }

      // Call the onApproved callback with supervisor details
      onApproved(employeeId, result.name || "");
    } catch (error) {
      console.error("Authentication Error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSupervisorScan();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Remanufacture Authorization</h2>
          
          <p className="text-center mb-2">
            Please scan supervisor ID to authorize remanufacture request
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Only users with remanufacture permission can authorize this request
          </p>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Input
            type="text"
            placeholder="Scan or Enter Supervisor ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
            className="w-full"
          />

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={handleSupervisorScan}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading ? "Verifying..." : "Verify Supervisor"}
            </Button>
            <Button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
