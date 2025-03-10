"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface JobNotFoundDialogProps {
  onClose: () => void;
  routeCard: string;
}

export default function JobNotFoundDialog({ onClose, routeCard }: JobNotFoundDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              The job with route card <span className="font-medium">{routeCard}</span> was not found in the database.
            </p>
            <p className="text-gray-600 text-sm">
              This typically means the job has not been entered into the system yet.
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