// src/app/api/debug-token/route.ts
import { NextResponse } from "next/server";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

export async function GET() {
  try {
    const roleArn = process.env.AWS_ROLE_ARN;
    
    if (!roleArn) {
      return NextResponse.json({
        success: false,
        error: "Missing AWS_ROLE_ARN environment variable"
      }, { status: 400 });
    }
    
    console.log("Attempting to get token information");
    console.log("Role ARN:", roleArn);
    
    // Just create the provider to see if it logs anything useful
    awsCredentialsProvider({
      roleArn,
    });
    
    // Return the role ARN we're using
    return NextResponse.json({
      success: true,
      message: "This endpoint just logs the token process, check Vercel logs",
      roleArn,
    });
  } catch (error) {
    console.error("Error in token debugging:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}