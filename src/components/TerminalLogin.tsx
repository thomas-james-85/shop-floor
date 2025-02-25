"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal, terminalActions } from "@/contexts/terminalContext"; // Import updated context
import { TerminalData } from "@/types";

export default function TerminalLogin() {
  const { state, dispatch } = useTerminal(); // Access updated context
  const [terminalId, setTerminalId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    if (!terminalId || !password) {
      setError("Please enter Terminal ID and Password");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/terminal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminal_id: parseInt(terminalId),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        console.log("API error");
        setIsLoading(false);
        return;
      }

      // Process response data
      console.log("Terminal login response:", data);

      // Update global terminal state using our new reducer
      // Add the type annotation to make it explicit
      const loginData: Partial<TerminalData> = {
        terminalId: parseInt(terminalId),
        terminalName: data.terminal_name,
        operationCode: data.operation_code,
        terminalState: "IDLE",
        lastStateChange: new Date(),
      };
      dispatch(terminalActions.login(loginData));

      // Clear form after successful login
      setTerminalId("");
      setPassword("");
    } catch (error) {
      console.error("Login error:", error);
      setError("Server error, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <Card className="w-96 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Terminal Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Input
            type="number"
            placeholder="Terminal ID"
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </Button>
          {state.terminal.terminalName && (
            <p className="text-center text-sm text-gray-500">
              Connected to: {state.terminal.terminalName}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
