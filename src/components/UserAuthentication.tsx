"use client";

import { useState } from "react";
import ScanUserDialog from "@/components/ScanUserDialog";
import { TerminalData } from "@/types";

type UserAuthenticationProps = {
  terminalData: TerminalData | null;
  roleRequired:
    | "can_operate"
    | "can_setup"
    | "can_inspect"
    | "can_remanufacture";
  onAuthenticated: (updatedTerminalData: TerminalData) => void;
};

export default function UserAuthentication({
  terminalData,
  roleRequired,
  onAuthenticated,
}: UserAuthenticationProps) {
  const [awaitingScan, setAwaitingScan] = useState(true);

  if (!awaitingScan) return null; // ✅ Hide component if no scan is required

  return (
    <ScanUserDialog
      roleRequired={roleRequired}
      onAuthenticated={(name) => {
        if (!terminalData) return;

        // ✅ Update terminalData with authenticated user
        const updatedTerminalData = {
          ...terminalData,
          loggedInUser: name,
        };

        onAuthenticated(updatedTerminalData);
        setAwaitingScan(false); // ✅ Close dialog after authentication
      }}
      onCancel={() => setAwaitingScan(false)}
    />
  );
}
