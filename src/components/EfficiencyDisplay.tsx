// src/components/EfficiencyDisplay.tsx
"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EfficiencyMetrics } from "@/utils/efficiencyCalculator";

interface EfficiencyDisplayProps {
  metrics: EfficiencyMetrics;
  process: "Setup" | "Running";
  onClose: () => void;
}

export default function EfficiencyDisplay({
  metrics,
  process,
  onClose,
}: EfficiencyDisplayProps) {
  // Function to determine color based on efficiency
  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 110) return "text-green-600";
    if (efficiency >= 95) return "text-blue-500";
    if (efficiency >= 80) return "text-yellow-500";
    return "text-red-600";
  };

  // Function to determine background color for gauge
  const getGaugeColor = (efficiency: number) => {
    if (efficiency >= 110) return "bg-green-500";
    if (efficiency >= 95) return "bg-blue-500";
    if (efficiency >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate the percentage for the gauge (capped at 150% for display purposes)
  const gaugePercentage = Math.min(metrics.efficiency, 150) / 150 * 100;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <Card className="w-[600px] shadow-lg">
        <CardContent className="p-6">
          <div className="bg-white rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{process} Complete!</h3>
              <div className={`text-2xl font-bold ${getEfficiencyColor(metrics.efficiency)}`}>
                {metrics.efficiency}% Efficient
              </div>
            </div>
            
            <div className="mb-6">
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getGaugeColor(metrics.efficiency)}`}
                  style={{ width: `${gaugePercentage}%`, transition: "width 1s ease-out" }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
                <span>150%</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-100 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-500">Planned</div>
                <div className="text-lg font-semibold">{metrics.planned} min</div>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-500">Actual</div>
                <div className="text-lg font-semibold">{metrics.actual} min</div>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg text-center">
                <div className="text-sm text-gray-500">Time Saved</div>
                <div className={`text-lg font-semibold ${metrics.timeSaved >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {metrics.timeSaved >= 0 ? "+" : ""}{metrics.timeSaved} min
                </div>
              </div>
            </div>
            
            {metrics.quantity !== undefined && metrics.plannedPerItem !== undefined && (
              <div className="mt-4 flex justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="text-sm text-gray-500">Quantity: </span>
                  <span className="font-medium">{metrics.quantity} units</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Plan per unit: </span>
                  <span className="font-medium">{metrics.plannedPerItem} min</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}