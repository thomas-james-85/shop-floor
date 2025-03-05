// src/app/api/email/test/route.ts
import { NextResponse } from "next/server";
import {
  testEmailConnection,
  sendRemanufactureEmail,
} from "@/utils/emailService";

// GET endpoint to test email connection
export async function GET(req: Request) {
  try {
    // Test the email connection
    const result = await testEmailConnection();

    return NextResponse.json(
      {
        success: result.success,
        message: result.message,
        config: result.config, // This will include the email server configuration
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error("Email Test Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST endpoint to test sending a remanufacture email
export async function POST(req: Request) {
  try {
    // Create sample data for testing
    const sampleData = {
      rejectId: 12345,
      customerName: "Test Customer Ltd",
      contractNumber: "54321",
      routeCard: "RC-9876",
      partNumber: "PART-1234",
      qtyRejected: 5,
      remanufactureQty: 5,
      operatorName: "John Operator",
      supervisorName: "Jane Supervisor",
      reason: "Test reject reason",
      operationCode: "OP123",
      machineName: "Machine 01",
      createdAt: new Date().toISOString(),
    };

    // Send the test email
    const result = await sendRemanufactureEmail(sampleData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Email Send Test Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
