// src/utils/emailService.ts
import nodemailer from "nodemailer";

/**
 * Configuration for email service
 * All settings are loaded from environment variables
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  recipientEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
}

// Load email configuration from environment variables
const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "465"),
  secure: process.env.EMAIL_SECURE !== "false", // Default to true if not specified
  user: process.env.EMAIL_USER || "",
  password: process.env.EMAIL_PASSWORD || "",
  from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "",
  recipientEmails: (process.env.EMAIL_RECIPIENTS || "")
    .split(",")
    .filter(Boolean),
  ccEmails: process.env.EMAIL_CC
    ? process.env.EMAIL_CC.split(",").filter(Boolean)
    : [],
  bccEmails: process.env.EMAIL_BCC
    ? process.env.EMAIL_BCC.split(",").filter(Boolean)
    : [],
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Log configuration (without password)
  console.log("Creating email transporter with config:", {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    user: emailConfig.user,
    recipients: emailConfig.recipientEmails.length,
    cc: emailConfig.ccEmails?.length,
    bcc: emailConfig.bccEmails?.length,
  });

  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.password,
    },
  });
};

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

/**
 * Formats the remanufacture email HTML content
 */
const formatRemanufactureEmailHtml = (data: RejectEmailData): string => {
  const date = data.createdAt
    ? new Date(data.createdAt).toLocaleString()
    : new Date().toLocaleString();

  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #2a5885; font-size: 24px; margin-bottom: 20px; }
          h2 { color: #2a5885; font-size: 18px; margin-top: 25px; }
          .info-group { margin-bottom: 15px; }
          .info-row { display: flex; margin-bottom: 8px; }
          .label { font-weight: bold; width: 170px; }
          .value { flex: 1; }
          .alert { background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin: 15px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Remanufacture Request #${data.rejectId}</h1>
          
          <div class="alert">
            <strong>Action Required:</strong> Please process this remanufacture request as soon as possible.
          </div>
          
          <div class="info-group">
            <div class="info-row">
              <div class="label">Request ID:</div>
              <div class="value">${data.rejectId}</div>
            </div>
            <div class="info-row">
              <div class="label">Date:</div>
              <div class="value">${date}</div>
            </div>
          </div>
          
          <h2>Job Information</h2>
          <div class="info-group">
            <div class="info-row">
              <div class="label">Customer:</div>
              <div class="value">${data.customerName}</div>
            </div>
            <div class="info-row">
              <div class="label">Contract Number:</div>
              <div class="value">${data.contractNumber}</div>
            </div>
            <div class="info-row">
              <div class="label">Route Card:</div>
              <div class="value">${data.routeCard}</div>
            </div>
            <div class="info-row">
              <div class="label">Part Number:</div>
              <div class="value">${data.partNumber}</div>
            </div>
          </div>
          
          <h2>Reject Information</h2>
          <div class="info-group">
            <div class="info-row">
              <div class="label">Operation:</div>
              <div class="value">${data.operationCode}</div>
            </div>
            <div class="info-row">
              <div class="label">Machine:</div>
              <div class="value">${data.machineName || "N/A"}</div>
            </div>
            <div class="info-row">
              <div class="label">Quantity Rejected:</div>
              <div class="value">${data.qtyRejected}</div>
            </div>
            <div class="info-row">
              <div class="label">Qty to Remanufacture:</div>
              <div class="value">${data.remanufactureQty}</div>
            </div>
            <div class="info-row">
              <div class="label">Reason:</div>
              <div class="value">${data.reason}</div>
            </div>
          </div>
          
          <h2>Personnel</h2>
          <div class="info-group">
            <div class="info-row">
              <div class="label">Operator:</div>
              <div class="value">${data.operatorName}</div>
            </div>
            <div class="info-row">
              <div class="label">Authorized By:</div>
              <div class="value">${data.supervisorName}</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated notification from the Manufacturing Terminal System. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Formats the remanufacture email plain text content (as fallback)
 */
const formatRemanufactureEmailText = (data: RejectEmailData): string => {
  const date = data.createdAt
    ? new Date(data.createdAt).toLocaleString()
    : new Date().toLocaleString();

  return `
REMANUFACTURE REQUEST #${data.rejectId}

ACTION REQUIRED: Please process this remanufacture request as soon as possible.

REQUEST DETAILS:
- Request ID: ${data.rejectId}
- Date: ${date}

JOB INFORMATION:
- Customer: ${data.customerName}
- Contract Number: ${data.contractNumber}
- Route Card: ${data.routeCard}
- Part Number: ${data.partNumber}

REJECT INFORMATION:
- Operation: ${data.operationCode}
- Machine: ${data.machineName || "N/A"}
- Quantity Rejected: ${data.qtyRejected}
- Quantity to Remanufacture: ${data.remanufactureQty}
- Reason: ${data.reason}

PERSONNEL:
- Operator: ${data.operatorName}
- Authorized By: ${data.supervisorName}

This is an automated notification from the Manufacturing Terminal System. Please do not reply to this email.
`;
};

/**
 * Sends email notification for remanufacture requests
 */
export async function sendRemanufactureEmail(data: RejectEmailData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Check if email is configured
    if (
      !emailConfig.user ||
      !emailConfig.password ||
      emailConfig.recipientEmails.length === 0
    ) {
      console.warn("Email configuration incomplete. Email will not be sent.");
      return {
        success: false,
        error: "Email not configured. Check environment variables.",
      };
    }

    console.log("Sending remanufacture email with data:", data);

    // Create the email transporter
    const transporter = createTransporter();

    // Prepare email content
    const htmlContent = formatRemanufactureEmailHtml(data);
    const textContent = formatRemanufactureEmailText(data);

    // Set up email data
    const mailOptions = {
      from: `"Manufacturing Terminal" <${emailConfig.from}>`,
      to: emailConfig.recipientEmails.join(","),
      cc: emailConfig.ccEmails?.length
        ? emailConfig.ccEmails.join(",")
        : undefined,
      bcc: emailConfig.bccEmails?.length
        ? emailConfig.bccEmails.join(",")
        : undefined,
      subject: `Remanufacture Request #${data.rejectId} - ${data.partNumber}`,
      text: textContent,
      html: htmlContent,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
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
 * Test function to verify email configuration
 * Can be called from a test endpoint or utility
 */
export async function testEmailConnection(): Promise<{
  success: boolean;
  message: string;
  config?: Partial<EmailConfig>;
}> {
  try {
    // Check if email is configured
    if (!emailConfig.user || !emailConfig.password) {
      return {
        success: false,
        message: "Email not configured. Check environment variables.",
        config: {
          host: emailConfig.host,
          port: emailConfig.port,
          secure: emailConfig.secure,
          user: emailConfig.user ? "✓ Set" : "✗ Missing",
          password: emailConfig.password ? "✓ Set" : "✗ Missing",
          recipientEmails: emailConfig.recipientEmails,
        },
      };
    }

    const transporter = createTransporter();

    // Verify the connection
    await transporter.verify();

    return {
      success: true,
      message: `Email connection successful. Using account: ${emailConfig.user}`,
      config: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: emailConfig.user,
        recipientEmails: emailConfig.recipientEmails,
        ccEmails: emailConfig.ccEmails,
        bccEmails: emailConfig.bccEmails,
      },
    };
  } catch (error) {
    console.error("Email connection test failed:", error);
    return {
      success: false,
      message: `Email connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      config: {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        user: emailConfig.user,
      },
    };
  }
}
