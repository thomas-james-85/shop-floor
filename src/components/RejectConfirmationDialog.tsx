// src/components/RejectConfirmationDialog.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RejectConfirmationDialogProps = {
  remainingBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function RejectConfirmationDialog({
  remainingBalance,
  onConfirm,
  onCancel,
}: RejectConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Incomplete Job</h2>
          
          <div className="text-center mb-4">
            <p className="text-lg mb-2">
              This job has a remaining balance of <span className="font-bold">{remainingBalance}</span> units.
            </p>
            <p className="text-md text-gray-700">
              Do you need to request a remanufacture for the remaining quantity?
            </p>
          </div>

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={onConfirm}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
            >
              Yes, Request Remanufacture
            </Button>
            <Button
              onClick={onCancel}
              className="bg-gray-500 hover:bg-gray-600 text-white"
            >
              No, Complete As Is
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
