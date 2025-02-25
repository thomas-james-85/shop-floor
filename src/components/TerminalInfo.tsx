"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useTerminal, terminalActions } from "@/contexts/terminalContext";

// Terminal state background colors
const stateColors: Record<string, string> = {
  IDLE: "bg-red-600 text-black shadow-2xl",
  SETUP: "bg-yellow-400 text-black shadow-2xl",
  RUNNING: "bg-green-600 text-black shadow-2xl",
  PAUSED: "bg-blue-600 text-white animate-pulse shadow-2xl",
  INSPECTION_REQUIRED:
    "bg-orange-400 text-black shadow-2xl ring-4 ring-orange-500",
};

export default function TerminalInfo() {
  const { state, dispatch } = useTerminal();
  const [timeSinceChange, setTimeSinceChange] = useState("0m 0s");
  const router = useRouter();

  // Update elapsed time every second
  useEffect(() => {
    if (!state.terminal.lastStateChange) {
      // Set a default value or return early
      setTimeSinceChange("0m 0s");
      return;
    }

    const updateTimer = () => {
      // In src/components/TerminalInfo.tsx, modify line 30
      const diffInSeconds = Math.floor(
        (new Date().getTime() -
          (state.terminal.lastStateChange
            ? new Date(state.terminal.lastStateChange).getTime()
            : new Date().getTime())) /
          1000
      );
      setTimeSinceChange(
        `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [state.terminal.lastStateChange]);

  const handleLogout = () => {
    // Clear both terminal data and logged in user
    localStorage.removeItem("terminalData");
    localStorage.removeItem("loggedUser");

    // Reset state
    dispatch(terminalActions.resetState());

    // Redirect to login page
    router.replace("/login");
  };

  return (
    <div
      className={`w-[800px] h-[180px] ${
        stateColors[state.terminal.terminalState]
      } border-2 border-black rounded-lg p-4 relative flex flex-col justify-between shadow-lg mb-2`}
    >
      {/* Logout Button (Top Left Corner) */}
      <button
        onClick={handleLogout}
        className="absolute top-3 left-3 p-2 bg-white rounded-full hover:bg-gray-200 transition"
        aria-label="Logout"
      >
        <LogOut className="w-5 h-5 text-gray-800" />
      </button>

      {/* Top Row: Terminal Name (Left) | Operation Code (Right) */}
      <div className="flex justify-between items-center text-lg pl-10">
        <span>{state.terminal.terminalName}</span>
        <span>{state.terminal.operationCode}</span>
      </div>

      {/* Centered Terminal State */}
      <div className="text-center text-6xl font-bold">
        {state.terminal.terminalState}
      </div>

      {/* Bottom Row: Logged-in User (Left) | Time Since Change (Right) */}
      <div className="flex justify-between items-center text-lg font-semibold">
        <span className="text-4xl font-bold">
          {state.terminal.loggedInUser || "No User"}
        </span>
        <span className="text-sm">{timeSinceChange}</span>
      </div>
    </div>
  );
}
