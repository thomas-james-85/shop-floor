"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TerminalLogin from "@/components/TerminalLogin";
import { useTerminal } from "@/contexts/terminalContext"; // Import the context hook

export default function LoginPage() {
  const router = useRouter();
  const { terminalData } = useTerminal(); // Get terminal state from context

  // Redirect if terminal is already logged in
  useEffect(() => {
    if (terminalData.terminalId) {
      router.replace("/"); // Redirect to home (or dashboard)
    }
  }, [terminalData.terminalId, router]);

  // Show "Redirecting..." message if already authenticated
  if (terminalData.terminalId) {
    return <p className="text-lg text-gray-600">Redirecting...</p>;
  }

  return <TerminalLogin />;
}
