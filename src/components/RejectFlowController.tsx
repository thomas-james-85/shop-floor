// src/components/RejectFlowController.tsx
"use client";

import { useState, useEffect } from "react";
import { JobData, TerminalData } from "@/types";
import RejectConfirmationDialog from "./RejectConfirmationDialog";
import RemanufactureApprovalDialog from "./RemanufactureApprovalDialog";
import RejectReasonDialog, { RejectReason } from "./RejectReasonDialog";
import RejectQuantityDialog from "./RejectQuantityDialog";
import RejectSummaryDialog from "./RejectSummaryDialog";
import RejectSuccessDialog from "./RejectSuccessDialog";
import {
  RejectData,
  createReject,
  getRejectReasons,
} from "@/utils/rejectService";

type RejectFlowProps = {
  jobData: JobData;
  completedQuantity: number;
  terminalData: TerminalData;
  operatorId: string;
  operatorName: string;
  onComplete: (rejectData?: RejectData) => void;
  onCancel: () => void;
};

type FlowStep =
  | "confirmation"
  | "approval"
  | "reason"
  | "quantity"
  | "summary"
  | "success";

export default function RejectFlowController({
  jobData,
  completedQuantity,
  terminalData,
  operatorId,
  operatorName,
  onComplete,
  onCancel,
}: RejectFlowProps) {
  // Flow control state
  const [currentStep, setCurrentStep] = useState<FlowStep>("confirmation");

  // Data collection state
  const [supervisorId, setSupervisorId] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState<string>("");
  const [reasonName, setReasonName] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [remanufactureQty, setRemanufactureQty] = useState<number>(0);
  const [rejectId, setRejectId] = useState<number>(0);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  // Calculate remaining balance
  const remainingBalance = jobData.balance - completedQuantity;
  const maxQuantity = jobData.quantity;

  // Load available reasons for this operation
  const [availableReasons, setAvailableReasons] = useState<RejectReason[]>([]);

  // Fetch reasons when component mounts
  useEffect(() => {
    const fetchReasons = async () => {
      if (jobData && jobData.op_code) {
        try {
          const result = await getRejectReasons(jobData.op_code);
          if (result.success && result.reasons) {
            setAvailableReasons(result.reasons);
          } else {
            console.error("Failed to load reject reasons:", result.error);
            // Add a default "Other" reason if we couldn't load any
            setAvailableReasons([
              { id: 99, name: "Other", description: "Reason not listed" },
            ]);
          }
        } catch (error) {
          console.error("Error fetching reasons:", error);
        }
      }
    };

    fetchReasons();
  }, [jobData]);

  // Submit reject to the backend
  const submitReject = async (): Promise<{
    rejectId: number;
    emailSent: boolean;
  }> => {
    // Prepare the request data
    const rejectRequestData: RejectData = {
      customerName: jobData.customer_name,
      contractNumber: jobData.contract_number,
      routeCard: jobData.route_card,
      partNumber: jobData.part_number,
      qtyRejected: remainingBalance,
      operatorId: operatorId,
      operatorName: operatorName,
      supervisorId: supervisorId,
      supervisorName: supervisorName,
      reason: reasonName === "Other" ? customReason : reasonName,
      remanufactureQty: remanufactureQty,
      machineId: terminalData.terminalId?.toString() || "",
      machineName: terminalData.terminalName || "",
      operationCode: jobData.op_code,
    };

    // Call the service
    const result = await createReject(rejectRequestData);

    if (!result.success) {
      throw new Error(result.error || "Failed to create remanufacture request");
    }

    return {
      rejectId: result.rejectId || 0,
      emailSent: result.emailSent || false,
    };
  };

  // Handle confirmation step
  const handleConfirmation = () => {
    setCurrentStep("approval");
  };

  // Handle approval step
  const handleApproval = (supId: string, supName: string) => {
    setSupervisorId(supId);
    setSupervisorName(supName);
    setCurrentStep("reason");
  };

  // Handle reason selection
  const handleReasonSelected = (_id: number, name: string, custom?: string) => {
    setReasonName(name); // This will be the actual text to use (either standard reason or custom text)
    if (custom) {
      setCustomReason(custom);
    }
    setCurrentStep("quantity");
  };

  // Handle quantity confirmation
  const handleQuantityConfirmed = (qty: number) => {
    setRemanufactureQty(qty);
    setCurrentStep("summary");
  };

  // Handle summary confirmation
  const handleSummaryConfirm = async () => {
    try {
      // Submit the reject to the backend
      const result = await submitReject();

      // Store the result data
      setRejectId(result.rejectId);
      setEmailSent(result.emailSent);

      // Move to success step
      setCurrentStep("success");
    } catch (error) {
      console.error("Error submitting reject:", error);
      // Could add error handling UI here
    }
  };

  // Handle edit from summary
  const handleSummaryEdit = () => {
    // Go back to reason selection step
    setCurrentStep("reason");
  };

  // Handle success step completion
  const handleSuccessClose = () => {
    // Create the complete reject data object
    const rejectData: RejectData = {
      rejectId,
      customerName: jobData.customer_name,
      contractNumber: parseInt(jobData.contract_number),
      routeCard: parseInt(jobData.route_card),
      partNumber: jobData.part_number,
      qtyRejected: remainingBalance,
      operatorId: operatorId,
      supervisorId: supervisorId,
      reason: reasonName === "Other" ? customReason : reasonName,
      remanufactureQty: remanufactureQty,
      machineId: terminalData.terminalId?.toString() || "",
      operationCode: jobData.op_code,
    };

    // Complete the flow with the reject data
    onComplete(rejectData);
  };

  // Handle cancel at any step
  const handleCancel = () => {
    onCancel();
  };

  // Render the current step
  return (
    <>
      {currentStep === "confirmation" && (
        <RejectConfirmationDialog
          remainingBalance={remainingBalance}
          onConfirm={handleConfirmation}
          onCancel={handleCancel}
        />
      )}

      {currentStep === "approval" && (
        <RemanufactureApprovalDialog
          onApproved={handleApproval}
          onCancel={handleCancel}
        />
      )}

      {currentStep === "reason" && (
        <RejectReasonDialog
          operationCode={jobData.op_code}
          reasons={availableReasons}
          onReasonSelected={handleReasonSelected}
          onCancel={handleCancel}
        />
      )}

      {currentStep === "quantity" && (
        <RejectQuantityDialog
          defaultQuantity={remainingBalance}
          maxQuantity={maxQuantity}
          onQuantityConfirmed={handleQuantityConfirmed}
          onCancel={handleCancel}
        />
      )}

      {currentStep === "summary" && (
        <RejectSummaryDialog
          jobDetails={{
            customerName: jobData.customer_name,
            contractNumber: jobData.contract_number,
            routeCard: jobData.route_card,
            partNumber: jobData.part_number,
            description: jobData.description,
          }}
          rejectDetails={{
            supervisorName,
            operatorName,
            reason:
              reasonName === "Other" ? `Other: ${customReason}` : reasonName,
            quantity: remanufactureQty,
            operationCode: jobData.op_code,
            machineId: terminalData.terminalId?.toString() || "",
          }}
          onConfirm={handleSummaryConfirm}
          onEdit={handleSummaryEdit}
          onCancel={handleCancel}
        />
      )}

      {currentStep === "success" && (
        <RejectSuccessDialog
          rejectId={rejectId}
          emailSent={emailSent}
          quantity={remanufactureQty}
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
}
