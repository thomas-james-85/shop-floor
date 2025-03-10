// src/utils/rejectService.ts

export type RejectData = {
  customerName: string;
  contractNumber: number | string;
  routeCard: number | string;
  partNumber: string;
  qtyRejected: number;
  operatorId: string;
  operatorName: string;
  supervisorId: string;
  supervisorName: string;
  reason: string;
  remanufactureQty: number;
  machineId: string;
  machineName?: string;
  operationCode: string;
};

/**
 * Creates a remanufacture request and sends notification email
 * @returns Object with status and reject ID
 */
export const createReject = async (
  rejectData: RejectData
): Promise<{
  success: boolean;
  rejectId?: number;
  emailSent?: boolean;
  error?: string;
}> => {
  try {
    console.log("Creating remanufacture request with data:", rejectData);

    // Convert string IDs to numbers if needed
    const contractNumber =
      typeof rejectData.contractNumber === "string"
        ? parseInt(rejectData.contractNumber)
        : rejectData.contractNumber;

    const routeCard =
      typeof rejectData.routeCard === "string"
        ? parseInt(rejectData.routeCard)
        : rejectData.routeCard;

    // Submit to the API
    const response = await fetch("/api/rejects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: rejectData.customerName,
        contract_number: contractNumber,
        route_card: routeCard,
        part_number: rejectData.partNumber,
        qty_rejected: rejectData.qtyRejected,
        operator_id: rejectData.operatorId,
        supervisor_id: rejectData.supervisorId,
        reason: rejectData.reason,
        remanufacture_qty: rejectData.remanufactureQty,
        machine_id: rejectData.machineId,
        operation_code: rejectData.operationCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API error:", data.error);
      return {
        success: false,
        error: data.error || "Failed to create remanufacture request",
      };
    }

    // Email is now sent from the API endpoint
    // Using the email_sent value returned from the API

    return {
      success: true,
      rejectId: data.reject_id,
      emailSent: data.email_sent,
    };
  } catch (error) {
    console.error("Remanufacture request error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error creating remanufacture request",
    };
  }
};

/**
 * Fetches reject reasons for the specified operation code
 */
export const getRejectReasons = async (
  operationCode: string
): Promise<{
  success: boolean;
  reasons?: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
  error?: string;
}> => {
  try {
    console.log(`Fetching reject reasons for operation: ${operationCode}`);

    const response = await fetch(
      `/api/rejects/reasons?operation_code=${encodeURIComponent(operationCode)}`
    );
    const data = await response.json();

    if (!response.ok) {
      console.error("API error:", data.error);
      return { success: false, error: data.error || "Failed to fetch reasons" };
    }

    // Transform the data to match the expected format
    const reasons = data.reasons.map((reason: { reject_id: number; reject_name: string; description?: string }) => ({
      id: reason.reject_id,
      name: reason.reject_name,
      description: reason.description,
    }));

    return {
      success: true,
      reasons,
    };
  } catch (error) {
    console.error("Error fetching reject reasons:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error fetching reasons",
    };
  }
};
