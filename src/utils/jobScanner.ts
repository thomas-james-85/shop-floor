import { JobData, TerminalData } from "@/types";

export interface RouteCardResponse {
  exists: boolean;
  operations?: Array<{ op_code: string; description: string }>;
  route_card?: string;
  contract_number?: string;
  operation_code?: string;
  code?: string;
}

export const handleJobScanned = async (
  barcode: string,
  terminalData: TerminalData | null
): Promise<JobData | RouteCardResponse | null> => {
  if (!terminalData) {
    console.error("handleJobScanned: No terminal data provided.");
    return null;
  }

  try {
    console.log(
      `Scanning job with barcode: ${barcode}, operation: ${terminalData.operationCode}`
    );

    const response = await fetch("/api/jobs/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan: barcode,
        operation_code: terminalData.operationCode || "",
        terminal_name: terminalData.terminalName || "",
        user_name: terminalData.loggedInUser || "",
      }),
    });

    const data = await response.json();

    // Handle standard success case
    if (response.ok && !("error" in data)) {
      // Ask user if job is marked "Complete"
      if (data.status === "Complete") {
        const confirmContinue = window.confirm(
          "This job's status is Complete. Do you wish to continue?"
        );
        if (!confirmContinue) {
          return null;
        }
      }

      console.log("Job Data Retrieved Successfully:", data);
      return data as JobData;
    }

    // Handle case where route card exists but operation is not assigned
    if (response.status === 409 && data.code === "OPERATION_NOT_ASSIGNED") {
      console.log("Operation not assigned to this job. Suggest adding it:", data);
      return {
        exists: true,
        operations: data.existing_operations,
        route_card: data.route_card,
        contract_number: data.contract_number,
        operation_code: data.operation_code,
        code: data.code
      };
    }

    // Handle error cases
    if (data.code === "NOT_FOUND") {
      // Don't show alert or log error for NOT_FOUND as we'll handle it with the dialog
      return { 
        exists: false,
        code: data.code,
        route_card: barcode
      };
    }
    
    // For other errors, log error, alert and return null
    console.error(`API Error: ${data.error || "Unknown error"}`);
    alert(`Error: ${data.error || "Unknown error"}`);
    return null;
  } catch (error) {
    console.error("Scan Error:", error);
    alert("An error occurred. Please try again.");
    return null;
  }
};

export const findRouteCard = async (
  routeCard: string
): Promise<RouteCardResponse> => {
  try {
    // Use the lookup API without an operation code to just check the route card
    const response = await fetch("/api/jobs/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan: routeCard,
        operation_code: "CHECK_ONLY", // This is a special value that the API will handle
      }),
    });

    const data = await response.json();

    if (response.status === 409 && data.code === "OPERATION_NOT_ASSIGNED") {
      return {
        exists: true,
        operations: data.existing_operations,
        route_card: data.route_card,
        contract_number: data.contract_number
      };
    }

    return { exists: false };
  } catch (error) {
    console.error("Find Route Card Error:", error);
    return { exists: false };
  }
};

export const addOperation = async (
  routeCard: string,
  contractNumber: string,
  operationCode: string,
  oneOff: boolean,
  replacesOperations?: string[],
  additionalOperation?: boolean,
  addedBy?: string
): Promise<JobData | null> => {
  try {
    const response = await fetch("/api/jobs/add-operation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route_card: routeCard,
        contract_number: contractNumber,
        operation_code: operationCode,
        one_off: oneOff,
        replaces_operations: replacesOperations,
        additional_operation: additionalOperation,
        added_by: addedBy
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Add Operation Error:", errorData.error);
      alert(`Error: ${errorData.error}`);
      return null;
    }

    const data = await response.json();
    console.log("Operation Added Successfully:", data);
    return data;
  } catch (error) {
    console.error("Add Operation Error:", error);
    alert("An error occurred while adding the operation. Please try again.");
    return null;
  }
};
