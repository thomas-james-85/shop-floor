"use client";

import { useState } from "react";
import { authenticateUser } from "@/utils/authenticateUser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ScanUserDialogProps = {
  roleRequired:
    | "can_operate"
    | "can_setup"
    | "can_inspect"
    | "can_remanufacture";
  onAuthenticated: () => void; // ✅ No need to pass userName, will be in localStorage
  onCancel: () => void;
};

export default function ScanUserDialog({
  roleRequired,
  onAuthenticated,
  onCancel,
}: ScanUserDialogProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async () => {
    setLoading(true);
    setError("");

    const result = await authenticateUser(employeeId, roleRequired);

    if (!result.success) {
      setError(result.error || "Authentication failed");
      setLoading(false);
      return;
    }

    // ✅ Save the scanned user in localStorage instead of passing via props
    localStorage.setItem("loggedUser", result.name!);

    onAuthenticated={(userName) => {
      localStorage.setItem("loggedUser", userName); // ✅ Store user name on successful scan
      setLoggedInUser(userName); // ✅ Ensure UI updates to show logged-in user
    }}
    
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
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
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
