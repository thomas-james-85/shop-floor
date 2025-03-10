# Implementation Plan: Adding Contract Number and Route Card to Job Logs

## Overview

This document outlines the implementation plan for adding contract number and route card fields to the job logs system. These changes will ensure that every log entry has proper reference to the associated contract and route card, improving traceability and reporting capabilities.

## 1. Database Changes (Already Completed)

✅ The following database changes have been executed:

```sql
-- Add new columns to job_logs table
ALTER TABLE public.job_logs
ADD COLUMN IF NOT EXISTS contract_number VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS route_card VARCHAR(50) NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_logs_contract_number ON public.job_logs(contract_number);
CREATE INDEX IF NOT EXISTS idx_job_logs_route_card ON public.job_logs(route_card);
```

✅ Historical data has been migrated using the SQL script to extract values from the lookup_code.

## 2. Code Modifications

### 2.1. API Layer Updates

#### `src/app/api/logs/jobs/route.ts`

- **POST Handler**:
  - Update request body validation to accept `contract_number` and `route_card`
  - Modify the INSERT query to include these new fields
  - Example:
    ```typescript
    // Current query
    const result = await db.query(
      `INSERT INTO job_logs 
      (lookup_code, user_id, machine_id, state, start_time, end_time, 
       completed_qty, comments, inspection_passed, inspection_type, inspection_qty) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING log_id`,
      [/* parameters */]
    );

    // Updated query
    const result = await db.query(
      `INSERT INTO job_logs 
      (lookup_code, contract_number, route_card, user_id, machine_id, state, start_time, end_time, 
       completed_qty, comments, inspection_passed, inspection_type, inspection_qty) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING log_id`,
      [
        lookup_code || null,
        contract_number || null,
        route_card || null,
        // rest of the parameters
      ]
    );
    ```

- **PATCH Handler**:
  - No changes needed as we don't expect to update these fields after creation

- **GET Handler**:
  - Ensure the SELECT queries include the new fields

### 2.2. Utility Function Updates

#### `src/utils/jobLogs.ts`

- **Update Interfaces**:
  ```typescript
  interface JobLogParams {
    lookup_code: string;
    contract_number: string; // Add this field
    route_card: string;      // Add this field
    user_id: string;
    machine_id: string;
    state: "SETUP" | "RUNNING" | "PAUSED" | "INSPECTION";
    // ...other existing fields
  }
  ```

- **Update Core Functions**:
  - `createJobLog`: Add the new parameters to the function
  - Modify all functions that call `createJobLog` to extract and pass contract_number and route_card

- **Update Specialized Functions**:
  - `startSetupLog`
  - `createInspectionLog`
  - `startRunningLog`
  - `resumeJob`
  - `pauseJob`

  Example modification for `startSetupLog`:
  ```typescript
  export const startSetupLog = async (
    jobData: JobData,
    terminalData: TerminalData,
    setterId: string
  ): Promise<{ success: boolean; log_id?: number; error?: string }> => {
    if (!jobData) {
      return { success: false, error: "Missing job data" };
    }

    // Format lookup_code properly
    const lookup_code = `${jobData.route_card}-${jobData.contract_number}-${jobData.op_code}`;

    return createJobLog({
      lookup_code,
      contract_number: jobData.contract_number, // Add this
      route_card: jobData.route_card,          // Add this
      user_id: setterId,
      machine_id: terminalData.terminalId?.toString() || "",
      state: "SETUP",
    });
  };
  ```

## 3. Component Review & Updates

### 3.1. Components to Check/Update

Review these components to ensure they pass job data correctly:

- `src/components/ScanUserDialog.tsx`
- `src/components/OperatorAuthDialog.tsx`
- `src/components/InspectionDialog.tsx`
- `src/components/StateControlButtons.tsx`
- `src/components/PauseDialog.tsx`
- `src/components/CompletionDialog.tsx`
- `src/components/AbandonDialog.tsx`

Key checks:
1. Ensure job data is available when log functions are called
2. If direct API calls are made, update those to include the new fields

## 4. Testing Plan

### 4.1. Unit Tests
- Test each utility function to verify contract_number and route_card are being passed correctly
- Create test cases to verify that null/undefined values are handled gracefully

### 4.2. Integration Tests
- Test each workflow end-to-end:
  - Setup process
  - Inspection process
  - Running process
  - Pausing/resuming
  - Completion
  - Abandonment

### 4.3. Database Verification
- Verify logs are being created with contract_number and route_card populated
- Run queries to ensure no NULL values are being added for new logs

## 5. Deployment Strategy

### 5.1. Deployment Steps
1. Deploy database changes (already completed)
2. Deploy API updates
3. Deploy utility function updates
4. Deploy component updates (if needed)

### 5.2. Rollback Plan
- Prepare SQL script to remove contract_number and route_card columns if needed
- Have previous version of code ready for quick rollback

## 6. Implementation Checklist

- [ ] Update `JobLogParams` interface in jobLogs.ts
- [ ] Modify `createJobLog` function to handle new fields
- [ ] Update specialized log creation functions
- [ ] Modify API POST handler in logs/jobs/route.ts
- [ ] Update API GET handler to return new fields
- [ ] Review all components that call log creation functions
- [ ] Test all workflows
- [ ] Deploy changes
- [ ] Verify logs are being created with correct data

## 7. Additional Considerations

### 7.1. Reporting
- Update any reports that might benefit from direct access to contract_number and route_card
- Consider creating views or new reports leveraging these fields

### 7.2. Performance
- Monitor query performance after adding the new fields and indexes
- Tune indexes if necessary

## 8. Timeline

| Task | Estimated Time | Dependencies |
|------|----------------|--------------|
| Database changes | Complete | None |
| Update interfaces and utility functions | 2 hours | Database changes |
| Update API handlers | 1 hour | Update interfaces |
| Component review | 2 hours | Update utility functions |
| Testing | 3 hours | All previous tasks |
| Deployment | 1 hour | Successful testing |
| **Total** | **9 hours** | |

## 9. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Missed component updates | Medium | Medium | Thorough testing of all workflows |
| Performance impact | Low | Low | Added indexes to new columns |
| Data inconsistency | Medium | Low | Validate all log entries have correct values |
| Error handling issues | Medium | Medium | Test with various edge cases |

## 10. Future Enhancements

Once this implementation is complete, consider these future enhancements:

1. Add validation to ensure contract_number and route_card formats are consistent
2. Create new reports or dashboards that leverage these fields for better analysis
3. Add filtering options in the UI based on contract or route card

---

Document prepared on March 10, 2025.
