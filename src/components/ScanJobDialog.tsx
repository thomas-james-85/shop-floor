"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { JobData } from "@/types";

export default function ScanJobDialog() {
  const { state, dispatch } = useTerminal();
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Only show this dialog when in IDLE state
  if (state.terminal.terminalState !== "IDLE") return null;

  const handleScan = async () => {
    if (!barcode.trim()) return;

    setLoading(true);
    setScanError(null);

    try {
      // Set loading state
      dispatch({ type: "SET_LOADING_JOB", payload: true });

      const response = await fetch("/api/jobs/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scan: barcode,
          operation_code: state.terminal.operationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || "error" in data) {
        setScanError(data.error || "Unknown error");
        dispatch({
          type: "SET_ERROR",
          payload: data.error || "Job scan failed",
        });
        setLoading(false);
        dispatch({ type: "SET_LOADING_JOB", payload: false });
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
          dispatch({ type: "SET_LOADING_JOB", payload: false });
          return;
        }
      }

      // Update state with the scanned job
      dispatch(terminalActions.setCurrentJob(data as JobData));

      // Clear the input field
      setBarcode("");
    } catch (error) {
      console.error("Scan Error:", error);
      setScanError("An error occurred. Please try again.");
      dispatch({
        type: "SET_ERROR",
        payload: "Server error while scanning job",
      });
    } finally {
      setLoading(false);
      dispatch({ type: "SET_LOADING_JOB", payload: false });
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  return (
    <Card className="w-[800px] h-[80px] rounded-2xl bg-white text-black shadow-lg flex items-center justify-center p-0">
      <CardContent className="w-full flex flex-col items-center justify-center p-0">
        {scanError && <p className="text-red-500 text-sm mb-2">{scanError}</p>}
        <div className="flex flex-row items-center justify-center space-x-4">
          <Input
            type="text"
            placeholder="Scan or Enter Job"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-[300px] h-[50px] text-lg px-4 border-2 border-black rounded-lg text-center"
            disabled={loading}
            autoFocus
          />
          <Button
            onClick={handleScan}
            className="w-[100px] h-[50px] text-lg font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition"
            disabled={loading}
          >
            {loading ? "Scanning..." : "Scan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
