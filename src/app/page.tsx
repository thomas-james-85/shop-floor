"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TerminalLogin from "@/components/TerminalLogin";
import TerminalInfo from "@/components/TerminalInfo";
import { JobData } from "@/types";
import { useTerminal } from "@/contexts/terminalContext"; // Import global context

export default function HomePage() {
  const { terminalData, setTerminalData } = useTerminal(); // Use context
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [scannedJob, setScannedJob] = useState<JobData | null>(null);
  const [awaitingSetterScan, setAwaitingSetterScan] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 gap-y-6">
      {!terminalData?.terminalId ? (
        <TerminalLogin />
      ) : (
        <>
          <TerminalInfo terminalData={terminalData} loggedInUser={loggedInUser} />

                
          
        </>
      )}
    </div>
  );
}
