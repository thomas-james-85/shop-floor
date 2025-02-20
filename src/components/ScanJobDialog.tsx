"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobData } from "@/types";

type ScanJobDialogProps = {
  terminalState:
    | "IDLE"
    | "SETUP"
    | "RUNNING"
    | "PAUSED"
    | "INSPECTION_REQUIRED";
  operationCode: string;
  onJobScanned: (jobData: JobData, userName: string) => void; // ✅ Now returns both JobData and User Name
};

export default function ScanJobDialog({
  terminalState,
  operationCode,
  onJobScanned,
}: ScanJobDialogProps) {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);

  if (terminalState !== "IDLE") return null;

  const handleScan = async () => {
    if (!barcode.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/jobs/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan: barcode, operation_code: operationCode }),
      });

      const data = await response.json();

      if (!response.ok || "error" in data) {
        alert(`Error: ${data.error || "Unknown error"}`);
        setLoading(false);
        return;
      }

      // If job status is "Complete", ask user for confirmation
      if (data.status === "Complete") {
        const confirmContinue = window.confirm(
          "This job's status is Complete. Do you wish to continue?"
        );
        if (!confirmContinue) {
          setBarcode(""); // Clear input
          setLoading(false);
          return;
        }
      }

      // ✅ Extract user name from API response (assuming it's included)
      const userName = data.user_name || "Unknown User"; // Default if missing

      // ✅ Ensure `onJobScanned` receives both `JobData` and `userName`
      onJobScanned(data as JobData, userName);
    } catch (error) {
      console.error("Scan Error:", error);
      alert("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <Card className="w-[800px] h-[80px] rounded-2xl bg-white text-black shadow-lg flex items-center justify-center p-0">
      <CardContent className="w-full flex flex-row items-center justify-center space-x-4 p-0">
        <Input
          type="text"
          placeholder="Scan or Enter Job"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-[300px] h-[50px] text-lg px-4 border-2 border-black rounded-lg text-center"
        />
        <Button
          onClick={handleScan}
          className="w-[100px] h-[50px] text-lg font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition"
          disabled={loading}
        >
          {loading ? "Scanning..." : "Scan"}
        </Button>
      </CardContent>
    </Card>
  );
}
