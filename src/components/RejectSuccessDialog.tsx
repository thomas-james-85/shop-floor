// src/components/RejectSuccessDialog.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail } from "lucide-react";

type RejectSuccessDialogProps = {
  rejectId: number;
  emailSent: boolean;
  quantity: number;
  onClose: () => void;
};

export default function RejectSuccessDialog({
  rejectId,
  emailSent,
  quantity,
  onClose,
}: RejectSuccessDialogProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-6">
          <div className="text-green-500">
            <CheckCircle size={60} />
          </div>
          
          <h2 className="text-xl font-bold">Remanufacture Request Submitted</h2>
          
          <div className="text-center">
            <p className="text-lg mb-2">
              Your request for {quantity} units has been submitted successfully.
            </p>
            <p className="text-sm text-gray-700 mb-4">
              Remanufacture Request ID: <span className="font-medium">{rejectId}</span>
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm">
              <Mail size={16} />
              <span>
                {emailSent 
                  ? "Notification email has been sent to the production team." 
                  : "Email notification will be sent shortly."}
              </span>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2"
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
