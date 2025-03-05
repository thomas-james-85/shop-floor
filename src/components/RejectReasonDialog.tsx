// src/components/RejectReasonDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type RejectReason = {
  id: number;
  name: string;
  description?: string;
};

type RejectReasonDialogProps = {
  operationCode: string;
  reasons?: RejectReason[]; // Can be provided directly or fetched internally
  onReasonSelected: (
    reasonId: number,
    reasonName: string,
    customReason?: string
  ) => void;
  onCancel: () => void;
};

// ID to use for the "Other" option
const OTHER_REASON_ID = 9999;

export default function RejectReasonDialog({
  operationCode,
  reasons: initialReasons,
  onReasonSelected,
  onCancel,
}: RejectReasonDialogProps) {
  // State for selected reason and custom reason
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State for reasons (if fetched internally)
  const [reasons, setReasons] = useState<RejectReason[]>(initialReasons || []);

  // Fetch reasons if not provided
  useEffect(() => {
    if (!initialReasons) {
      fetchRejectReasons();
    } else {
      // Add the "Other" option if it's not already in the list
      const reasonsWithOther = addOtherOption(initialReasons);
      setReasons(reasonsWithOther);
    }
  }, [initialReasons, operationCode]);

  // Helper function to add the "Other" option to any list of reasons
  const addOtherOption = (reasonsList: RejectReason[]): RejectReason[] => {
    // Check if "Other" is already in the list
    if (
      !reasonsList.some((r) => r.name === "Other" || r.id === OTHER_REASON_ID)
    ) {
      // Add the "Other" option
      return [
        ...reasonsList,
        {
          id: OTHER_REASON_ID,
          name: "Other",
          description: "Enter a custom reason not listed above",
        },
      ];
    }
    return reasonsList;
  };

  // Function to fetch reject reasons from API
  const fetchRejectReasons = async () => {
    setLoading(true);
    try {
      // Call the API to get reasons for this operation code
      const response = await fetch(
        `/api/rejects/reasons?operation_code=${encodeURIComponent(
          operationCode
        )}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reasons");
      }

      // Transform the API response to match our expected format
      const apiReasons: RejectReason[] = data.reasons.map((reason: any) => ({
        id: reason.reject_id,
        name: reason.reject_name,
        description: reason.description,
      }));

      // Add the "Other" option
      const reasonsWithOther = addOtherOption(apiReasons);
      setReasons(reasonsWithOther);
    } catch (error) {
      console.error("Error fetching reject reasons:", error);
      setError("Failed to load reject reasons");

      // Fallback to a default set of reasons with "Other" option
      setReasons([
        {
          id: 1,
          name: "Incorrect dimensions",
          description: "Part does not meet dimensional requirements",
        },
        {
          id: 2,
          name: "Surface finish issue",
          description: "Surface quality below standard",
        },
        {
          id: 3,
          name: "Material defect",
          description: "Raw material issue detected",
        },
        {
          id: 4,
          name: "Tool mark",
          description: "Visible tool marks on finished part",
        },
        {
          id: OTHER_REASON_ID,
          name: "Other",
          description: "Enter a custom reason not listed above",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Check if the selected reason is "Other"
  const isOtherSelected =
    selectedReasonId === OTHER_REASON_ID ||
    reasons.find((r) => r.id === selectedReasonId)?.name === "Other";

  // Handle form submission
  const handleSubmit = () => {
    // Validate selection
    if (!selectedReasonId) {
      setError("Please select a reason");
      return;
    }

    // If "Other" is selected, ensure custom reason is provided
    if (isOtherSelected && !customReason.trim()) {
      setError("Please specify a custom reason");
      return;
    }

    // Get the standard reason name
    const reasonName =
      reasons.find((r) => r.id === selectedReasonId)?.name || "";

    // Call the callback with the selected reason
    // If "Other" is selected, pass the custom reason text
    // The customReason will be used as the actual reason text in logs
    onReasonSelected(
      selectedReasonId,
      isOtherSelected ? customReason : reasonName, // Use custom text as the actual reason
      isOtherSelected ? customReason : undefined
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Select Rejection Reason</h2>

          <p className="text-center mb-4">
            Please select the reason for requesting remanufacture
          </p>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {loading ? (
            <p className="text-gray-500">Loading reasons...</p>
          ) : (
            <div className="w-full">
              <RadioGroup
                value={selectedReasonId?.toString()}
                onValueChange={(value) => setSelectedReasonId(parseInt(value))}
                className="space-y-3 w-full"
              >
                {reasons.map((reason) => (
                  <div
                    key={reason.id}
                    className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50"
                  >
                    <RadioGroupItem
                      value={reason.id.toString()}
                      id={`reason-${reason.id}`}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`reason-${reason.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {reason.name}
                      </Label>
                      {reason.description && (
                        <p className="text-sm text-gray-500">
                          {reason.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </RadioGroup>

              {/* Custom reason input for "Other" */}
              {isOtherSelected && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <Label
                    htmlFor="custom-reason"
                    className="text-sm font-medium block mb-2"
                  >
                    Please specify reason:
                  </Label>
                  <Input
                    id="custom-reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full border-gray-300"
                    placeholder="Enter specific reason"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Continue
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
