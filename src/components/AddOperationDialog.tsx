"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { addOperation } from "@/utils/jobScanner";
import { JobData } from "@/types";

interface Operation {
  op_code: string;
  description: string;
}

interface AddOperationDialogProps {
  routeCard: string;
  contractNumber: string;
  operationCode: string;
  existingOperations: Operation[];
  onClose: () => void;
  onSuccess: (job: JobData) => void;
  userId?: string;
}

export default function AddOperationDialog({
  routeCard,
  contractNumber,
  operationCode,
  existingOperations,
  onClose,
  onSuccess,
  userId
}: AddOperationDialogProps) {
  const [isOneOff, setIsOneOff] = useState<boolean | null>(null);
  const [replacesOperations, setReplacesOperations] = useState<string[]>([]);
  const [isAdditional, setIsAdditional] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (checked) {
      setReplacesOperations(prev => [...prev, value]);
    } else {
      setReplacesOperations(prev => prev.filter(op => op !== value));
    }
  };
  
  const handleSubmit = async () => {
    if (isOneOff === null) return;
    
    setLoading(true);
    try {
      // If this is a one-off, we don't care about replaces/additional
      const replacesOps = isOneOff ? undefined : replacesOperations;
      const additional = isOneOff ? undefined : isAdditional;
      
      const result = await addOperation(
        routeCard,
        contractNumber,
        operationCode,
        isOneOff,
        replacesOps,
        additional,
        userId
      );
      
      if (result) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Failed to add operation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg overflow-y-auto max-h-[90vh]">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Add New Operation
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Operation <span className="font-medium">{operationCode}</span> is not assigned to route card <span className="font-medium">{routeCard}</span>.
            </p>
            <p className="text-gray-600 text-sm mb-4">
              You can add this operation to continue processing.
            </p>
            
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Is this a one-off operation?</h3>
              <RadioGroup 
                defaultValue="no"
                className="flex flex-col space-y-2"
                onValueChange={(value) => setIsOneOff(value === "yes")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="oneoff-yes" />
                  <Label htmlFor="oneoff-yes">Yes - Just for this specific job</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="oneoff-no" />
                  <Label htmlFor="oneoff-no">No - This should be a standard operation</Label>
                </div>
              </RadioGroup>
            </div>
            
            {isOneOff === false && existingOperations.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-800 mb-2">
                  Does this operation replace any existing operations?
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Select all that apply:
                </p>
                
                <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded">
                  {existingOperations.map((op) => (
                    <div key={op.op_code} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`op-${op.op_code}`}
                        value={op.op_code}
                        onChange={handleCheckboxChange}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`op-${op.op_code}`} className="text-sm">
                        {op.op_code}: {op.description}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isOneOff === false && (
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="additional-op"
                    checked={isAdditional}
                    onChange={(e) => setIsAdditional(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="additional-op">
                    This is an additional operation
                  </label>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isOneOff === null || loading}
            >
              {loading ? "Adding..." : "Add Operation"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}