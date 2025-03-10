# Implementation Plan for Adding Operation ID to Job Logs

## 1. Database Schema Changes ✅

Database changes have been completed:
- Added `operation_id` column to the `job_logs` table
- Set default value of 1 for all existing records

## 2. Backend API Changes

### Files to Modify

1. **src/app/api/logs/jobs/route.ts**
   - Update POST endpoint to accept `operation_id` parameter
   - Update query to include operation_id in INSERT statements
   - Update PATCH endpoint to handle operation_id updates
   - Update GET endpoint to include operation_id in response

2. **src/utils/jobLogs.ts**
   - Update `JobLogParams` interface to include `operation_id` field
   - Modify all helper functions to pass operation_id:
     - `createJobLog`
     - `startSetupLog`
     - `createInspectionLog`
     - `startRunningLog`
     - `pauseJob`
     - `resumeJob`

3. **src/utils/operationService.ts (new file)**
   - Create a utility to look up operation_id from operation_code
   - This will be needed to convert between operation codes and IDs

## 3. Frontend Changes

### Files to Modify

1. **src/contexts/terminalContext.tsx**
   - Add operationId to terminal state (alongside operationCode)
   - Update state initialization and management

2. **src/app/api/terminal/login/route.ts**
   - Modify to fetch and return operation_id alongside operation_code

3. **src/components/ScanUserDialog.tsx**
   - Update to pass operation_id when creating logs

4. **src/components/OperatorAuthDialog.tsx**
   - Update to pass operation_id when creating logs

5. **src/components/InspectionDialog.tsx**
   - Update to pass operation_id when creating inspection logs

6. **src/components/StateControlButtons.tsx**
   - Update log creation calls to include operation_id

## 4. Implementation Steps

1. **Create Operation Service Utility**
   - Implement the new utility to map operation codes to IDs
   - Test with known operation codes

2. **API Updates**
   - Modify the logs API to handle operation_id
   - Update all job log creation functions

3. **Terminal Login Flow**
   - Update terminal login to fetch operation_id
   - Modify context to store operation_id

4. **Component Updates**
   - Update all components that create or interact with logs
   - Ensure operation_id is passed correctly

## 5. Testing Plan

1. Test terminal login to ensure operation_id is correctly fetched and stored
2. Test each workflow (setup, running, inspection, pause, resume) to verify logs include operation_id
3. Review database logs to confirm data integrity
4. Test edge cases (e.g., operation code doesn't match any known operation)

## 6. Final Steps

1. Create any necessary database indexes for performance
2. Add foreign key constraints if needed
3. Document the changes for future reference

This implementation plan assumes that the database changes have already been completed and focuses on the code changes needed to fully integrate the operation_id throughout the application.
