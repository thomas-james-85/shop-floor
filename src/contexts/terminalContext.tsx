"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { TerminalData } from "@/types";

// Define context
const TerminalContext = createContext<
  | {
      terminalData: TerminalData;
      setTerminalData: (data: TerminalData) => void;
    }
  | undefined
>(undefined);

// Provider component
export const TerminalProvider = ({ children }: { children: ReactNode }) => {
  const [terminalData, setTerminalData] = useState<TerminalData>({
    terminalId: null,
    terminalName: null,
    operationCode: null,
    loggedInUser: null,
    terminalState: "IDLE",
    lastStateChange: null,
  });

  return (
    <TerminalContext.Provider value={{ terminalData, setTerminalData }}>
      {children}
    </TerminalContext.Provider>
  );
};

// Custom hook to use the terminal context
export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return context;
};
 