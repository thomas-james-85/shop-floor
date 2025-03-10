"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface JobNotFoundDialogProps {
  onClose: () => void;
  routeCard: string;
  terminalName?: string;
  operationCode?: string;
}

export default function JobNotFoundDialog({ 
  onClose, 
  routeCard,
  terminalName,
  operationCode 
}: JobNotFoundDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              The job with routecard-contract <span className="font-medium">{routeCard}</span> was not found in the database.
            </p>
            <p className="text-gray-600 text-sm mb-2">
              An email has been sent to request it to be added.
            </p>
            
            {operationCode && (
              <div className="text-left p-2 bg-gray-50 rounded mb-3 text-sm">
                <p><span className="font-medium">Operation:</span> {operationCode}</p>
                {terminalName && <p><span className="font-medium">Terminal:</span> {terminalName}</p>}
              </div>
            )}
            
            <p className="text-gray-600 text-sm bg-blue-50 p-2 rounded border border-blue-200">
              <span className="font-medium">Note:</span> An email notification has been sent to the admin team about this missing job.
            </p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}