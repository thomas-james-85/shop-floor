"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { TerminalData, JobData } from "@/types";

// Extend the AppState interface to include log IDs
type AppState = {
  terminal: TerminalData;
  currentJob: JobData | null;
  isLoadingJob: boolean;
  isLoadingUser: boolean;
  error: string | null;
  activeLogId: number | null; // Add this to track the current active log
  activeLogState: "SETUP" | "RUNNING" | "PAUSED" | "INSPECTION" | null; // The state of the active log
};

// Define all possible action types
type ActionType =
  | { type: "SET_TERMINAL_DATA"; payload: Partial<TerminalData> }
  | { type: "SET_TERMINAL_STATE"; payload: TerminalData["terminalState"] }
  | { type: "SET_CURRENT_JOB"; payload: JobData | null }
  | { type: "SET_LOGGED_IN_USER"; payload: string | null }
  | { type: "SET_LOADING_JOB"; payload: boolean }
  | { type: "SET_LOADING_USER"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" }
  | { type: "RESET_TERMINAL" }
  | { type: "RESET_JOB" }
  | { type: "RESET_STATE" }
  | {
      type: "SET_ACTIVE_LOG";
      payload: { logId: number | null; logState: AppState["activeLogState"] };
    }
  | { type: "CLEAR_ACTIVE_LOG" };

// Update the initial state
const initialState: AppState = {
  terminal: {
    terminalId: null,
    terminalName: null,
    operationCode: null,
    operationId: null, // Added operationId
    loggedInUser: null,
    terminalState: "IDLE",
    lastStateChange: null,
  },
  currentJob: null,
  isLoadingJob: false,
  isLoadingUser: false,
  error: null,
  activeLogId: null,
  activeLogState: null,
};

// The reducer function to handle all state updates
function terminalReducer(state: AppState, action: ActionType): AppState {
  switch (action.type) {
    case "SET_TERMINAL_DATA":
      return {
        ...state,
        terminal: {
          ...state.terminal,
          ...action.payload,
          lastStateChange:
            action.payload.lastStateChange || state.terminal.lastStateChange,
        },
      };

    case "SET_TERMINAL_STATE":
      return {
        ...state,
        terminal: {
          ...state.terminal,
          terminalState: action.payload,
          lastStateChange: new Date(),
        },
      };

    case "SET_CURRENT_JOB":
      return {
        ...state,
        currentJob: action.payload,
      };

    case "SET_LOGGED_IN_USER":
      return {
        ...state,
        terminal: {
          ...state.terminal,
          loggedInUser: action.payload,
        },
      };

    case "SET_LOADING_JOB":
      return {
        ...state,
        isLoadingJob: action.payload,
      };

    case "SET_LOADING_USER":
      return {
        ...state,
        isLoadingUser: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
      
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "RESET_TERMINAL":
      return {
        ...state,
        terminal: {
          ...state.terminal,
          loggedInUser: null,
          terminalState: "IDLE",
          lastStateChange: new Date(),
        },
      };

    case "RESET_JOB":
      return {
        ...state,
        currentJob: null,
      };

    case "RESET_STATE":
      return {
        ...state,
        terminal: {
          ...state.terminal,
          loggedInUser: null,
          terminalState: "IDLE",
          lastStateChange: new Date(),
        },
        currentJob: null,
        error: null,
      };

    case "SET_ACTIVE_LOG":
      return {
        ...state,
        activeLogId: action.payload.logId,
        activeLogState: action.payload.logState,
      };

    case "CLEAR_ACTIVE_LOG":
      return {
        ...state,
        activeLogId: null,
        activeLogState: null,
      };

    // When resetting the terminal, also clear the active log
    case "RESET_TERMINAL":
    case "RESET_JOB":
    case "RESET_STATE":
      return {
        ...state,
        activeLogId: null,
        activeLogState: null,
        // (rest of reset logic remains the same)
      };

    default:
      return state;
  }
}

// Create the context with the expanded type
const TerminalContext = createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<ActionType>;
    }
  | undefined
>(undefined);

// Updated provider component
export const TerminalProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(terminalReducer, initialState);

  // Load terminal data from localStorage on mount
  useEffect(() => {
    const savedTerminalData = localStorage.getItem("terminalData");
    if (savedTerminalData) {
      try {
        const parsedData = JSON.parse(savedTerminalData);
        dispatch({
          type: "SET_TERMINAL_DATA",
          payload: {
            ...parsedData,
            lastStateChange: parsedData.lastStateChange
              ? new Date(parsedData.lastStateChange)
              : null,
          },
        });
      } catch (error) {
        console.error("Error parsing terminal data from localStorage:", error);
      }
    }

    // Check for logged user in localStorage
    const loggedUser = localStorage.getItem("loggedUser");
    if (loggedUser) {
      dispatch({ type: "SET_LOGGED_IN_USER", payload: loggedUser });
    }
  }, []);

  // Save terminal data to localStorage when it changes
  useEffect(() => {
    if (state.terminal.terminalId) {
      localStorage.setItem("terminalData", JSON.stringify(state.terminal));
    }
  }, [state.terminal]);

  return (
    <TerminalContext.Provider value={{ state, dispatch }}>
      {children}
    </TerminalContext.Provider>
  );
};

// Updated hook to use the terminal context with reducer
export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return context;
};

// Helper action creators for common operations
export const terminalActions = {
  login: (terminalData: Partial<TerminalData>) => ({
    type: "SET_TERMINAL_DATA" as const,
    payload: terminalData,
  }),

  setTerminalState: (state: TerminalData["terminalState"]) => ({
    type: "SET_TERMINAL_STATE" as const,
    payload: state,
  }),

  setCurrentJob: (job: JobData | null) => ({
    type: "SET_CURRENT_JOB" as const,
    payload: job,
  }),

  setLoggedInUser: (userName: string | null) => ({
    type: "SET_LOGGED_IN_USER" as const,
    payload: userName,
  }),

  resetTerminal: () => ({
    type: "RESET_TERMINAL" as const,
  }),

  resetJob: () => ({
    type: "RESET_JOB" as const,
  }),

  resetState: () => ({
    type: "RESET_STATE" as const,
  }),

  setError: (error: string | null) => ({
    type: "SET_ERROR" as const,
    payload: error,
  }),
  
  clearError: () => ({
    type: "CLEAR_ERROR" as const,
  }),

  setActiveLog: (logId: number, logState: AppState["activeLogState"]) => ({
    type: "SET_ACTIVE_LOG" as const,
    payload: { logId, logState },
  }),

  clearActiveLog: () => ({
    type: "CLEAR_ACTIVE_LOG" as const,
  }),
};
