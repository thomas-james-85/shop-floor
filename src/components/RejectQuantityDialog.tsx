// src/components/RejectQuantityDialog.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type RejectQuantityDialogProps = {
  defaultQuantity: number; // Current remaining balance
  maxQuantity: number; // Maximum possible (original job quantity)
  onQuantityConfirmed: (quantity: number) => void;
  onCancel: () => void;
};

export default function RejectQuantityDialog({
  defaultQuantity,
  maxQuantity,
  onQuantityConfirmed,
  onCancel,
}: RejectQuantityDialogProps) {
  const [quantity, setQuantity] = useState<string>(defaultQuantity.toString());
  const [error, setError] = useState<string>("");

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuantity(e.target.value);
    setError(""); // Clear error when user changes the value
  };

  // Handle form submission
  const handleSubmit = () => {
    const parsedQuantity = parseInt(quantity);
    
    // Validate quantity
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Please enter a valid positive number");
      return;
    }
    
    if (parsedQuantity > maxQuantity) {
      setError(`Quantity cannot exceed ${maxQuantity}`);
      return;
    }
    
    // Call the callback with the validated quantity
    onQuantityConfirmed(parsedQuantity);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[500px] p-6 bg-white rounded-lg shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4">
          <h2 className="text-xl font-bold mb-4">Remanufacture Quantity</h2>
          
          <p className="text-center mb-4">
            Please confirm the quantity to remanufacture
          </p>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="w-full space-y-2">
            <Label htmlFor="remanufacture-qty" className="text-sm font-medium">
              Quantity to Remanufacture:
            </Label>
            <Input
              id="remanufacture-qty"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              onKeyDown={handleKeyDown}
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Default: {defaultQuantity} (remaining balance) | Maximum: {maxQuantity}
            </p>
          </div>

          <div className="flex space-x-4 w-full justify-center mt-4">
            <Button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Confirm Quantity
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
