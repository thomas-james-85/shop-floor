"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTerminal } from "@/contexts/terminalContext"; // Import the context hook
import { TerminalData } from "@/types";

export default function TerminalLogin() {
  const { setTerminalData } = useTerminal(); // Access context to update state
  const [terminalId, setTerminalId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!terminalId || !password) {
      setError("Please enter Terminal ID and Password");
      return;
    }

    try {
      const response = await fetch("/api/terminal/login", { //run api
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminal_id: parseInt(terminalId),
          password: password,
        }),
      });

      const data: TerminalData = await response.json(); // set data to response from api

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Store login session in localStorage
      localStorage.setItem("terminalData", JSON.stringify(data));

      // Update global terminal state
      setTerminalData({
        terminalId: data.terminalId,
        terminalName: data.terminalName,
        operationCode: data.operationCode,
        loggedInUser: data.loggedInUser,
        terminalState: data.terminalState || "IDLE",
        lastStateChange: data.lastStateChange,
      });
    } catch {
      setError("Server error, please try again.");
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
            onChange={(e) => setTerminalId(e.target.value)} //terminalId hook
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // password Hook
          />
          <Button className="w-full" onClick={handleLogin}>
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
