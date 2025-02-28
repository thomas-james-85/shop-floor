"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TerminalLogin from "@/components/TerminalLogin";
import { useTerminal } from "@/contexts/terminalContext";

export default function LoginPage() {
  const { state } = useTerminal();
  const router = useRouter();

  // Redirect if terminal is already logged in
  useEffect(() => {
    if (state.terminal.terminalId) {
      router.replace("/"); // Redirect to home page
    }
    // We need to include router in dependencies to satisfy the linter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.terminal.terminalId]);

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
