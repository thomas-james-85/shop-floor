export type TerminalData = {
    terminalId: number | null,
    terminalName: string | null,
    operationCode: string | null,
    loggedInUser: string | null,
    terminalState:
      | "IDLE"
      | "SETUP"
      | "RUNNING"
      | "PAUSED"
      | "INSPECTION_REQUIRED",
    lastStateChange: Date | null,
  };
  
  export type JobData = {
    contract_number: string,
    route_card: string,
    part_number: string,
    op_code: string,
    planned_setup_time: number,
    planned_run_time: number,
    quantity: number,
    customer_name: string,
    description: string,
    due_date: string,
    balance: number,
    status: string,
    completed_qty: number,
  };