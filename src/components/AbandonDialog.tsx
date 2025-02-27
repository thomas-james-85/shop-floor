// src/components/AbandonDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";

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

    try {
      // Call the onAbandon callback with the completed quantity and reason
      onAbandon(parseInt(completedQty) || 0, reason);
    } finally {
      setIsLogging(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAbandon();
    }
  };

  return (
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
  );
}
