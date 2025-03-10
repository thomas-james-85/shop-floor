"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";
import { JobData } from "@/types";
import { handleJobScanned, RouteCardResponse } from "@/utils/jobScanner";
import JobNotFoundDialog from "./JobNotFoundDialog";
import AddOperationDialog from "./AddOperationDialog";

export default function ScanJobDialog() {
  const { state, dispatch } = useTerminal();
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Dialog states
  const [showJobNotFoundDialog, setShowJobNotFoundDialog] = useState(false);
  const [showAddOperationDialog, setShowAddOperationDialog] = useState(false);
  const [routeCardData, setRouteCardData] = useState<RouteCardResponse | null>(null);

  // Only show this dialog when in IDLE state
  if (state.terminal.terminalState !== "IDLE") return null;

  const handleScan = async () => {
    if (!barcode.trim()) return;

    setLoading(true);
    setScanError(null);

    try {
      // Set loading state
      dispatch({ type: "SET_LOADING_JOB", payload: true });

      // Use the enhanced job scanner utility
      const result = await handleJobScanned(barcode, state.terminal);

      // Clear error state
      dispatch(terminalActions.clearError());

      if (!result) {
        // Generic error already handled by the utility
        setLoading(false);
        dispatch({ type: "SET_LOADING_JOB", payload: false });
        return;
      }

      // Check the type of result
      if ('code' in result) {
        // This is a route card response
        setRouteCardData(result);
        
        if (result.code === 'NOT_FOUND') {
          // Show job not found dialog
          setShowJobNotFoundDialog(true);
        } else if (result.code === 'OPERATION_NOT_ASSIGNED') {
          // Show add operation dialog
          setShowAddOperationDialog(true);
        }
        
        setLoading(false);
        dispatch({ type: "SET_LOADING_JOB", payload: false });
        return;
      }

      // If we get here, result is a JobData object
      // Update state with the scanned job
      dispatch(terminalActions.setCurrentJob(result as JobData));

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

  // Handle successful addition of operation
  const handleOperationAdded = (job: JobData) => {
    setShowAddOperationDialog(false);
    setRouteCardData(null);
    dispatch(terminalActions.setCurrentJob(job));
  };

  // Close dialogs and reset states
  const handleCloseDialogs = () => {
    setShowJobNotFoundDialog(false);
    setShowAddOperationDialog(false);
    setRouteCardData(null);
    setBarcode("");
  };

  return (
    <>
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

      {/* Job Not Found Dialog */}
      {showJobNotFoundDialog && routeCardData && (
        <JobNotFoundDialog 
          onClose={handleCloseDialogs} 
          routeCard={routeCardData.route_card || barcode}
          operationCode={state.terminal.operationCode || ""}
          terminalName={state.terminal.terminalName || ""}
        />
      )}

      {/* Add Operation Dialog */}
      {showAddOperationDialog && routeCardData && routeCardData.operations && (
        <AddOperationDialog 
          routeCard={routeCardData.route_card || barcode}
          contractNumber={routeCardData.contract_number || ""}
          operationCode={routeCardData.operation_code || (state.terminal.operationCode || "")}
          existingOperations={routeCardData.operations}
          onClose={handleCloseDialogs}
          onSuccess={handleOperationAdded}
          userId={state.terminal.loggedInUser || ""}
        />
      )}
    </>
  );
}
