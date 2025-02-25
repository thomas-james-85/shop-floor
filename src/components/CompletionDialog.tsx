"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";

type CompletionDialogProps = {
  onComplete: (completedQty: number) => void;
  onCancel: () => void;
};

export default function CompletionDialog({
  onComplete,
  onCancel,
}: CompletionDialogProps) {
  const { state } = useTerminal();
  const [completedQty, setCompletedQty] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleComplete = () => {
    // Validate input
    if (!completedQty.trim()) {
      setError("Please enter a quantity");
      return;
    }

    const qty = parseInt(completedQty);

    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    // Call the onComplete callback with the completed quantity
    onComplete(qty);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleComplete();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Job Completion</h2>

          <div className="w-full space-y-2">
            <p className="text-gray-700">
              Job:{" "}
              <span className="font-semibold">
                {state.currentJob?.part_number}
              </span>
            </p>
            <p className="text-gray-700">
              Required Quantity:{" "}
              <span className="font-semibold">
                {state.currentJob?.quantity}
              </span>
            </p>
            <p className="text-gray-700">
              Balance:{" "}
              <span className="font-semibold">{state.currentJob?.balance}</span>
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completed Quantity:
            </label>
            <Input
              type="number"
              placeholder="Enter quantity"
              value={completedQty}
              onChange={(e) => setCompletedQty(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full"
            />
          </div>

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={handleComplete}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Complete Job
            </Button>
            <Button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
