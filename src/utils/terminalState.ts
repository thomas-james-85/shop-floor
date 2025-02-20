export const updateTerminalState = (
  newState: "IDLE" | "SETUP" | "RUNNING" | "PAUSED" | "INSPECTION_REQUIRED",
  setTerminalState: (
    state: "IDLE" | "SETUP" | "RUNNING" | "PAUSED" | "INSPECTION_REQUIRED"
  ) => void
) => {
  console.log(`Updating terminal state to: ${newState}`);

  // ✅ Update local state
  setTerminalState(newState);

  // ✅ Store in localStorage so it persists
  localStorage.setItem("terminalState", newState);
};
