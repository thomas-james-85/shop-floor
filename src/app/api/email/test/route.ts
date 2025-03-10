// src/app/api/email/test/route.ts
import { NextResponse } from "next/server";
import {
  testEmailConnection,
  sendRemanufactureEmail,
  sendJobNotFoundEmail,
} from "@/utils/emailService";

// GET endpoint to test email connection
export async function GET() {
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
// The default action is 'remanufacture', but can also be 'job-not-found'
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'remanufacture';
  try {
    let result;
    
    if (action === 'job-not-found') {
      // Test job not found email
      const jobNotFoundData = {
        routeCard: "MISSING-12345",
        operationCode: "OP456",
        terminalName: "Terminal 01",
        userName: "Test User",
        scannedAt: new Date().toISOString(),
      };
      
      result = await sendJobNotFoundEmail(jobNotFoundData);
    } else {
      // Default: Test remanufacture email
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
      
      result = await sendRemanufactureEmail(sampleData);
    }

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
