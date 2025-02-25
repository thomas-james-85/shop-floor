"use client";

import { useEffect } from "react";
import TerminalLogin from "@/components/TerminalLogin";
import { useTerminal } from "@/contexts/terminalContext";

export default function LoginPage() {
  const { state } = useTerminal();

  // Redirect if terminal is already logged in
  useEffect(() => {
    if (state.terminal.terminalId) {
      router.replace("/"); // Redirect to home page
    }
  }, [state.terminal.terminalId, router]);

  // Show "Redirecting..." message if already authenticated
  if (state.terminal.terminalId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Redirecting...</p>
      </div>
    );
  }

  return <TerminalLogin />;
}
