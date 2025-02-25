"use client";

import { useState } from "react";
import { authenticateUser } from "@/utils/authenticateUser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";

type ScanUserDialogProps = {
  roleRequired:
    | "can_operate"
    | "can_setup"
    | "can_inspect"
    | "can_remanufacture";
  onCancel: () => void;
};

export default function ScanUserDialog({
  roleRequired,
  onCancel,
}: ScanUserDialogProps) {
  const { dispatch } = useTerminal();
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async () => {
    if (!employeeId.trim()) {
      setError("Please enter an employee ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      dispatch({ type: "SET_LOADING_USER", payload: true });

      const result = await authenticateUser(employeeId, roleRequired);

      if (!result.success) {
        setError(result.error || "Authentication failed");
        dispatch({
          type: "SET_ERROR",
          payload: result.error || "User authentication failed",
        });
        setLoading(false);
        dispatch({ type: "SET_LOADING_USER", payload: false });
        return;
      }

      // Update state with authenticated user
      dispatch(terminalActions.setLoggedInUser(result.name || ""));

      // Store in localStorage
      localStorage.setItem("loggedUser", result.name || "");

      // Update terminal state based on role
      if (roleRequired === "can_setup") {
        dispatch(terminalActions.setTerminalState("SETUP"));
      } else if (roleRequired === "can_operate") {
        dispatch(terminalActions.setTerminalState("RUNNING"));
      } else if (roleRequired === "can_inspect") {
        dispatch(terminalActions.setTerminalState("INSPECTION_REQUIRED"));
      }

      // Clear form
      setEmployeeId("");
    } catch (error) {
      console.error("Authentication Error:", error);
      setError("An error occurred. Please try again.");
      dispatch({
        type: "SET_ERROR",
        payload: "Server error during authentication",
      });
    } finally {
      setLoading(false);
      dispatch({ type: "SET_LOADING_USER", payload: false });
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[400px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-lg font-bold">
            {roleRequired === "can_setup" && "Please scan setter ID"}
            {roleRequired === "can_operate" && "Please scan operator ID"}
            {roleRequired === "can_inspect" && "Please scan inspector ID"}
            {roleRequired === "can_remanufacture" &&
              "Please scan supervisor ID"}
          </h2>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Input
            type="text"
            placeholder="Scan or Enter Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            autoFocus
          />

          <div className="flex space-x-2">
            <Button
              onClick={handleScan}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              {loading ? "Checking..." : "Scan"}
            </Button>
            <Button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded"
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
