"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TerminalLogin from "@/components/TerminalLogin";
import TerminalInfo from "@/components/TerminalInfo";
import ScanJobDialog from "@/components/ScanJobDialog";
import JobDetailsCard from "@/components/JobDetailsCard";
import StateControlButtons from "@/components/StateControlButtons";
import UserAuthentication from "@/components/UserAuthentication";
import { JobData } from "@/types";
import { useTerminal } from "@/contexts/terminalContext"; // Import global context

export default function HomePage() {
  const { terminalData, setTerminalData } = useTerminal(); // Use context
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [scannedJob, setScannedJob] = useState<JobData | null>(null);
  const [awaitingSetterScan, setAwaitingSetterScan] = useState(false);
  const router = useRouter();

  // Function to handle terminal state changes using context
  const handleStateChange = (newState: string) => {
    if (!terminalData) return;

    const updatedTerminalData = {
      ...terminalData,
      terminalState: newState,
      lastStateChange: new Date().toISOString(),
    };

    setTerminalData(updatedTerminalData);
    localStorage.setItem("terminalData", JSON.stringify(updatedTerminalData));

    if (newState === "SETUP") {
      setAwaitingSetterScan(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 gap-y-6">
      {!terminalData?.terminalId ? (
        <TerminalLogin />
      ) : (
        <>
          <TerminalInfo terminalData={terminalData} loggedInUser={loggedInUser} />

          {!scannedJob ? (
            <ScanJobDialog
              terminalState={terminalData.terminalState || "IDLE"}
              operationCode={terminalData.operationCode || ""}
              onJobScanned={(jobData: JobData, userName: string) => {
                setScannedJob(jobData);
                setLoggedInUser(userName);
                localStorage.setItem("loggedInUser", userName);
                handleStateChange("SETUP");
              }}
            />
          ) : (
            <JobDetailsCard jobData={scannedJob} />
          )}

          {awaitingSetterScan && (
            <UserAuthentication
              terminalData={terminalData}
              roleRequired="can_setup"
              onAuthenticated={(updatedTerminalData) => {
                setTerminalData(updatedTerminalData);
                localStorage.setItem("terminalData", JSON.stringify(updatedTerminalData));
                setAwaitingSetterScan(false);
              }}
            />
          )}

          <StateControlButtons
            handleStateChange={handleStateChange}
            terminalState={terminalData.terminalState || "IDLE"}
            scannedJob={!!scannedJob}
            setScannedJob={setScannedJob}
            loggedInUser={loggedInUser}
            setLoggedInUser={setLoggedInUser}
          />
        </>
      )}
    </div>
  );
}
