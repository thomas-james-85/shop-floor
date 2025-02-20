"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { TerminalData } from "@/types";

type TerminalInfoProps = {
  terminalData: TerminalData;
  loggedInUser: string | null;
};

// ✅ Define terminal state background colors
const stateColors: Record<string, string> = {
  IDLE: "bg-red-600 text-black shadow-2xl",
  SETUP: "bg-yellow-400 text-black shadow-2xl",
  RUNNING: "bg-green-600 text-black shadow-2xl",
  PAUSED: "bg-blue-600 text-white animate-pulse shadow-2xl",
  INSPECTION_REQUIRED: "bg-orange-400 text-black shadow-2xl ring-4 ring-orange-500",
};

export default function TerminalInfo({ terminalData, loggedInUser }: TerminalInfoProps) {
  const [timeSinceChange, setTimeSinceChange] = useState("0m 0s");
  const router = useRouter();

  // ✅ Read logged-in user from localStorage
  const loggedUser = localStorage.getItem("loggedUser") || "No User";


  // ✅ Update elapsed time every second
  useEffect(() => {
    const updateTimer = () => {
      const diffInSeconds = Math.floor(
        (new Date().getTime() - new Date(terminalData.lastStateChange).getTime()) / 1000
      );
      setTimeSinceChange(`${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [terminalData.lastStateChange]);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    router.replace("/login");
  };

  return (
    <div
      className={`w-[800px] h-[180px] ${stateColors[terminalData.terminalState]} border-2 border-black rounded-lg p-4 relative flex flex-col justify-between shadow-lg mb-2`}
    >
      {/* ✅ Logout Button (Top Left Corner) */}
      <button
        onClick={handleLogout}
        className="absolute top-3 left-3 p-2 bg-white rounded-full hover:bg-gray-200 transition"
        aria-label="Logout"
      >
        <LogOut className="w-5 h-5 text-gray-800" />
      </button>

      {/* ✅ Top Row: Terminal Name (Left) | Operation Code (Right) */}
      <div className="flex justify-between items-center text-lg pl-10">
        <span>{terminalData.terminalName}</span>
        <span>{terminalData.operationCode}</span>
      </div>

      {/* ✅ Centered Terminal State */}
      <div className="text-center text-6xl font-bold">{terminalData.terminalState}</div>

      {/* ✅ Bottom Row: Logged-in User (Left) | Time Since Change (Right) */}
      <div className="flex justify-between items-center text-lg font-semibold">
        <span className="text-4xl font-bold">{loggedInUser || "No User"}</span>
        <span className="text-sm">{timeSinceChange}</span>
      </div>
    </div>
  );
}
