"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";

type PauseDialogProps = {
  onPause: (reason: string) => void;
  onCancel: () => void;
};

export default function PauseDialog({ onPause, onCancel }: PauseDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handlePause = () => {
    // Validate input
    if (!reason.trim()) {
      setError("Please enter a reason for pausing");
      return;
    }

    // Call the onPause callback with the reason
    onPause(reason);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePause();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Pause Operation</h2>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Pausing:
            </label>
            <textarea
              className="w-full h-32 p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter reason for pausing operation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={handlePause}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Pause Operation
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
