// src/utils/operationService.ts
import db from "@/lib/db";

interface OperationResult {
  success: boolean;
  operation_id?: number;
  error?: string;
}

/**
 * Utility to get operation_id from operation_code
 */
export const getOperationIdFromCode = async (
  operation_code: string
): Promise<OperationResult> => {
  try {
    // Query the database to get the operation ID
    const result = await db.query(
      `SELECT operation_id FROM operations WHERE operation_code = $1`,
      [operation_code]
    );

    if (result.rows.length === 0) {
      return { 
        success: false, 
        error: "Operation code not found"
      };
    }

    return {
      success: true,
      operation_id: result.rows[0].operation_id
    };
  } catch (error) {
    console.error("Operation lookup error:", error);
    return {
      success: false,
      error: "Failed to retrieve operation ID"
    };
  }
};