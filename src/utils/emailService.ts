// src/utils/emailService.ts

/**
 * This is a placeholder for a real email service implementation.
 * In a production environment, you would integrate with a service like:
 * - Nodemailer for SMTP
 * - SendGrid, Mailgun, or similar cloud email service
 * - AWS SES
 */

export type RejectEmailData = {
  rejectId: number;
  customerName: string;
  contractNumber: number | string;
  routeCard: number | string;
  partNumber: string;
  qtyRejected: number;
  remanufactureQty: number;
  operatorName: string;
  supervisorName: string;
  reason: string;
  operationCode: string;
  machineName?: string;
  createdAt?: Date | string;
};

export async function sendRemanufactureEmail(data: RejectEmailData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    console.log("Sending remanufacture email with data:", data);

    // In a real implementation, this would call an email service API.
    // For now, we'll just simulate a successful email send.

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Log the email content to the console for demonstration
    console.log("=============== EMAIL CONTENT ===============");
    console.log(`To: production@example.com`);
    console.log(
      `Subject: Remanufacture Request #${data.rejectId} - ${data.partNumber}`
    );
    console.log(`
      A remanufacture request has been submitted with the following details:
      
      Request ID: ${data.rejectId}
      Date: ${data.createdAt || new Date().toISOString()}
      
      Job Information:
      - Customer: ${data.customerName}
      - Contract Number: ${data.contractNumber}
      - Route Card: ${data.routeCard}
      - Part Number: ${data.partNumber}
      
      Reject Information:
      - Operation: ${data.operationCode}
      - Machine: ${data.machineName || "N/A"}
      - Quantity Rejected: ${data.qtyRejected}
      - Quantity to Remanufacture: ${data.remanufactureQty}
      - Reason: ${data.reason}
      
      Personnel:
      - Operator: ${data.operatorName}
      - Authorized By: ${data.supervisorName}
      
      Please process this remanufacture request as soon as possible.
      
      This is an automated notification. Please do not reply.
    `);
    console.log("=============== END EMAIL ===============");

    return {
      success: true,
      messageId: `rmf_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
}

/**
 * In Phase 3 of the implementation, this module would be expanded with:
 * 1. Real email service integration
 * 2. Email templates
 * 3. Configuration for recipients
 * 4. Error handling and retries
 * 5. Logging and monitoring
 */
