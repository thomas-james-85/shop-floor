// src/components/EmailTestPanel.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * A component for testing email functionality
 * This can be embedded in an admin panel or development tools page
 */
export default function EmailTestPanel() {
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    config?: {
      host: string;
      port: string | number;
      secure: boolean;
      user: string;
      recipientEmails?: string[];
      ccEmails?: string[];
      bccEmails?: string[];
    };
  }>({ loading: false });

  const [sendStatus, setSendStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    messageId?: string;
  }>({ loading: false });

  const [testEmailData, setTestEmailData] = useState({
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
  });

  // Test the email connection
  const testEmailConnection = async () => {
    setTestStatus({ loading: true });
    try {
      const response = await fetch("/api/email/test");
      const data = await response.json();

      setTestStatus({
        loading: false,
        success: data.success,
        message: data.message || data.error || "Unknown error",
        config: data.config,
      });
    } catch (error) {
      setTestStatus({
        loading: false,
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to test email connection",
      });
    }
  };

  // Send a test email
  const sendTestEmail = async () => {
    setSendStatus({ loading: true });
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      setSendStatus({
        loading: false,
        success: data.success,
        message: data.message || data.error || "Unknown error",
        messageId: data.messageId,
      });
    } catch (error) {
      setSendStatus({
        loading: false,
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send test email",
      });
    }
  };

  // Handle input changes for test data
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTestEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Email Configuration Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current configuration display */}
        {testStatus.config && (
          <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-lg font-medium mb-3">
              Current Email Configuration
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">SMTP Host:</div>
              <div>{testStatus.config.host}</div>

              <div className="font-medium">SMTP Port:</div>
              <div>{testStatus.config.port}</div>

              <div className="font-medium">Secure Connection:</div>
              <div>
                {testStatus.config.secure ? "Yes (SSL/TLS)" : "No (STARTTLS)"}
              </div>

              <div className="font-medium">Email User:</div>
              <div>{testStatus.config.user}</div>

              <div className="font-medium">Recipients:</div>
              <div>
                {testStatus.config.recipientEmails?.length
                  ? testStatus.config.recipientEmails.join(", ")
                  : "None configured"}
              </div>

              {testStatus.config.ccEmails && testStatus.config.ccEmails.length > 0 && (
                <>
                  <div className="font-medium">CC:</div>
                  <div>{testStatus.config.ccEmails.join(", ")}</div>
                </>
              )}

              {testStatus.config.bccEmails && testStatus.config.bccEmails.length > 0 && (
                <>
                  <div className="font-medium">BCC:</div>
                  <div>{testStatus.config.bccEmails.join(", ")}</div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Connection test section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Test Email Connection</h3>
          <div className="flex items-center gap-4">
            <Button onClick={testEmailConnection} disabled={testStatus.loading}>
              {testStatus.loading ? "Testing..." : "Test Connection"}
            </Button>

            {testStatus.message && (
              <div
                className={`px-4 py-2 rounded flex-1 ${
                  testStatus.success
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {testStatus.message}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4"></div>

        {/* Send test email section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Send Test Remanufacture Email</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                name="customerName"
                value={testEmailData.customerName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="partNumber">Part Number</Label>
              <Input
                id="partNumber"
                name="partNumber"
                value={testEmailData.partNumber}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="operatorName">Operator Name</Label>
              <Input
                id="operatorName"
                name="operatorName"
                value={testEmailData.operatorName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="supervisorName">Supervisor Name</Label>
              <Input
                id="supervisorName"
                name="supervisorName"
                value={testEmailData.supervisorName}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="reason">Reject Reason</Label>
              <Input
                id="reason"
                name="reason"
                value={testEmailData.reason}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="operationCode">Operation Code</Label>
              <Input
                id="operationCode"
                name="operationCode"
                value={testEmailData.operationCode}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex items-start gap-4 pt-4">
            <Button onClick={sendTestEmail} disabled={sendStatus.loading}>
              {sendStatus.loading ? "Sending..." : "Send Test Email"}
            </Button>

            {sendStatus.message && (
              <div
                className={`px-4 py-2 rounded flex-1 ${
                  sendStatus.success
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <p>{sendStatus.message}</p>
                {sendStatus.messageId && (
                  <p className="text-sm mt-1">
                    Message ID: {sendStatus.messageId}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Environment variables reminder */}
        <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
          <p className="font-medium">Required Environment Variables</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div>
              <code>EMAIL_HOST</code> - SMTP server hostname
            </div>
            <div>
              <code>EMAIL_PORT</code> - SMTP server port
            </div>
            <div>
              <code>EMAIL_SECURE</code> - Use SSL/TLS (true/false)
            </div>
            <div>
              <code>EMAIL_USER</code> - Email username/address
            </div>
            <div>
              <code>EMAIL_PASSWORD</code> - Email password/app password
            </div>
            <div>
              <code>EMAIL_FROM</code> - Sender name and email
            </div>
            <div>
              <code>EMAIL_RECIPIENTS</code> - Comma-separated recipients
            </div>
            <div>
              <code>EMAIL_CC</code> - Optional CC recipients
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
