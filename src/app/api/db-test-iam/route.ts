// src/app/api/test-iam/route.ts
import { NextResponse } from "next/server";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

export async function GET() {
  try {
    const roleArn = process.env.AWS_ROLE_ARN;
    const region = process.env.AWS_REGION || "eu-west-2";
    const hostname = process.env.RDS_HOSTNAME;
    const username = process.env.RDS_USERNAME;
    const port = parseInt(process.env.RDS_PORT || "5432");

    // Check if required variables are available
    if (!roleArn || !hostname || !username) {
      return NextResponse.json({
        success: false,
        error: "Missing required environment variables",
        missingVars: {
          roleArn: !roleArn,
          hostname: !hostname,
          username: !username,
        }
      }, { status: 400 });
    }

    console.log("Testing IAM auth token generation");
    console.log("Role ARN:", roleArn);
    console.log("Region:", region);
    console.log("Hostname:", hostname);
    console.log("Username:", username);
    console.log("Port:", port);

    // Create credentials provider
    const credentialsProvider = awsCredentialsProvider({
      roleArn,
    });

    // Try to get credentials first to see if that works
    try {
      console.log("Requesting AWS credentials via OIDC...");
      const creds = await credentialsProvider();
      console.log("Successfully obtained AWS credentials", {
        accessKeyId: creds.accessKeyId.substring(0, 5) + "...",
        expiration: creds.expiration,
      });
    } catch (credError) {
      console.error("Error obtaining AWS credentials:", credError);
      return NextResponse.json({
        success: false,
        error: "Failed to obtain AWS credentials",
        details: credError instanceof Error ? credError.message : String(credError),
      }, { status: 500 });
    }

    // Now try to get the RDS token
    const signer = new Signer({
      credentials: credentialsProvider,
      region,
      hostname,
      port,
      username,
    });
    
    const token = await signer.getAuthToken();
    
    return NextResponse.json({
      success: true,
      message: "Successfully generated IAM auth token",
      tokenLength: token.length,
    });
  } catch (error) {
    console.error("Error generating IAM auth token:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}