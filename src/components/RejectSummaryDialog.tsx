// src/components/RejectSummaryDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RejectSummaryProps = {
  jobDetails: {
    customerName: string;
    contractNumber: string;
    routeCard: string;
    partNumber: string;
    description?: string;
  };
  rejectDetails: {
    supervisorName: string;
    operatorName: string;
    reason: string;
    quantity: number;
    operationCode: string;
    machineId: string;
  };
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
};

export default function RejectSummaryDialog({
  jobDetails,
  rejectDetails,
  onConfirm,
  onEdit,
  onCancel,
}: RejectSummaryProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // In a real implementation, we would submit to the backend here
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 800));
      onConfirm();
    } catch (error) {
      console.error("Error submitting reject:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[600px] p-6 bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Remanufacture Request Summary</h2>
          
          <p className="text-center mb-4">
            Please review the following information before submitting
          </p>

          <div className="w-full space-y-6">
            {/* Job Details Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2">Job Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-600">Customer:</div>
                <div className="text-sm font-medium">{jobDetails.customerName}</div>
                
                <div className="text-sm text-gray-600">Contract Number:</div>
                <div className="text-sm font-medium">{jobDetails.contractNumber}</div>
                
                <div className="text-sm text-gray-600">Route Card:</div>
                <div className="text-sm font-medium">{jobDetails.routeCard}</div>
                
                <div className="text-sm text-gray-600">Part Number:</div>
                <div className="text-sm font-medium">{jobDetails.partNumber}</div>
                
                {jobDetails.description && (
                  <>
                    <div className="text-sm text-gray-600">Description:</div>
                    <div className="text-sm font-medium">{jobDetails.description}</div>
                  </>
                )}
              </div>
            </div>

            {/* Reject Details Section */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-2">Remanufacture Details</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-gray-600">Operator:</div>
                <div className="text-sm font-medium">{rejectDetails.operatorName}</div>
                
                <div className="text-sm text-gray-600">Authorized By:</div>
                <div className="text-sm font-medium">{rejectDetails.supervisorName}</div>
                
                <div className="text-sm text-gray-600">Reason:</div>
                <div className="text-sm font-medium">{rejectDetails.reason}</div>
                
                <div className="text-sm text-gray-600">Quantity:</div>
                <div className="text-sm font-medium">{rejectDetails.quantity}</div>
                
                <div className="text-sm text-gray-600">Operation Code:</div>
                <div className="text-sm font-medium">{rejectDetails.operationCode}</div>
                
                <div className="text-sm text-gray-600">Machine ID:</div>
                <div className="text-sm font-medium">{rejectDetails.machineId}</div>
              </div>
            </div>

            {/* Note about email notification */}
            <p className="text-sm text-gray-600 italic">
              After submission, an email notification will be sent to the production team 
              with all remanufacture details.
            </p>
          </div>

          <div className="flex space-x-3 w-full justify-center mt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
            <Button
              onClick={onEdit}
              disabled={isSubmitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Edit Details
            </Button>
            <Button
              onClick={onCancel}
              disabled={isSubmitting}
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
