// src/components/AbandonDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal } from "@/contexts/terminalContext"; // Removed unused terminalActions
import { EfficiencyMetrics } from "@/utils/efficiencyCalculator";
import { getJobLogById } from "@/utils/jobLogs";
import { logEfficiency } from "@/utils/efficiencyLogger";
import EfficiencyDisplay from "./EfficiencyDisplay";

type AbandonDialogProps = {
  onAbandon: (completedQty: number, reason: string) => void;
  onCancel: () => void;
  requireQty: boolean;
};

export default function AbandonDialog({
  onAbandon,
  onCancel,
  requireQty,
}: AbandonDialogProps) {
  const { state } = useTerminal();
  const [completedQty, setCompletedQty] = useState<string>("0");
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLogging, setIsLogging] = useState<boolean>(false);
  
  // For efficiency tracking
  const [showEfficiency, setShowEfficiency] = useState<boolean>(false);
  const [efficiencyMetrics, setEfficiencyMetrics] = useState<EfficiencyMetrics | null>(null);

  const handleAbandon = async () => {
    // Validate input
    if (!reason.trim()) {
      setError("Please enter a reason for abandoning this job");
      return;
    }

    if (requireQty) {
      const qty = parseInt(completedQty);
      if (isNaN(qty) || qty < 0) {
        setError("Please enter a valid quantity (0 or greater)");
        return;
      }
    }

    setIsLogging(true);
    setError("");

    try {
      // If we have an active running log and quantity > 0, log efficiency metrics before abandoning
      if (state.activeLogId && 
          state.activeLogState && 
          (state.activeLogState === "RUNNING" || state.activeLogState === "SETUP") && 
          state.currentJob) {
        
        const qty = parseInt(completedQty) || 0;
        
        // For running logs with quantity, or setup logs, calculate efficiency
        if ((state.activeLogState === "RUNNING" && qty > 0) || 
            state.activeLogState === "SETUP") {
          
          // Get the job log to access its start time
          const jobLogResult = await getJobLogById(state.activeLogId);
          
          if (jobLogResult.success && jobLogResult.log) {
            const jobLog = jobLogResult.log;
            const startTime = jobLog.start_time as string;
            const endTime = new Date().toISOString();
            const lookupCode = `${state.currentJob.route_card}-${state.currentJob.contract_number}-${state.currentJob.op_code}`;
            
            // Log efficiency metrics
            const efficiencyResult = await logEfficiency({
              jobLogId: state.activeLogId,
              lookupCode,
              logType: state.activeLogState === "SETUP" ? "SETUP" : "RUNNING",
              startTime,
              endTime,
              jobData: state.currentJob,
              quantity: state.activeLogState === "RUNNING" ? qty : undefined
            });
            
            if (efficiencyResult.success && efficiencyResult.efficiencyMetrics) {
              setEfficiencyMetrics(efficiencyResult.efficiencyMetrics);
              setShowEfficiency(true);
            }
          }
        }
      }
      
      // If we're showing efficiency, we'll call onAbandon after the user views the metrics
      if (!showEfficiency) {
        onAbandon(parseInt(completedQty) || 0, reason);
      }
    } catch (error) {
      console.error("Error during abandon process:", error);
      setError("An error occurred. Please try again.");
      setIsLogging(false);
    } finally {
      if (!showEfficiency) {
        setIsLogging(false);
      }
    }
  };
  
  const handleEfficiencyClose = () => {
    setShowEfficiency(false);
    setIsLogging(false);
    
    // Now complete the abandon process
    onAbandon(parseInt(completedQty) || 0, reason);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAbandon();
    }
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
        <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
          <CardContent className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-bold mb-4">Abandon Job</h2>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="w-full space-y-4">
              {requireQty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Completed Before Abandoning:
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter completed quantity"
                    value={completedQty}
                    onChange={(e) => setCompletedQty(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Abandoning:
                </label>
                <textarea
                  className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reason for abandoning this job..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-4 w-full justify-center mt-4">
              <Button
                onClick={handleAbandon}
                className="bg-red-500 hover:bg-red-600 text-white"
                disabled={isLogging}
              >
                {isLogging ? "Logging..." : "Abandon Job"}
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
          process={state.activeLogState === "SETUP" ? "Setup" : "Running"} 
          onClose={handleEfficiencyClose} 
        />
      )}
    </>
  );
}