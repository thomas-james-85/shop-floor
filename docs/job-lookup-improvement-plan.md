# Implementation Plan: Enhanced Job Lookup Recovery Process

## 1. Overview

This plan outlines the implementation of an enhanced job lookup recovery process for the Manufacturing Terminal System. When a job scan fails to find an exact match in the database, the system will provide intelligent options for handling the job rather than simply showing an error message.

## 2. New Workflow

### 2.1 Basic Flow
1. User scans job barcode
2. System attempts to find job by full lookup code (route card + contract number + operation code)
3. If found, proceed as normal
4. If not found:
   - Search for route card in jobs table
   - If route card doesn't exist: Show "Job not found in database" dialog
   - If route card exists but operation not assigned: Show "Add operation" dialog

### 2.2 "Add Operation" Flow
1. Ask user if this is a one-off requirement (Yes/No)
2. If not a one-off:
   - Show list of existing operations for this route card
   - Allow user to select operations this new operation replaces (checkboxes)
   - Include "Additional operation" checkbox
3. Create new job record with this information
4. Proceed with normal job processing

## 3. Database Changes

### 3.1 Add New Columns to Jobs Table
```sql
ALTER TABLE jobs
ADD COLUMN user_added BOOLEAN DEFAULT FALSE,
ADD COLUMN one_off BOOLEAN DEFAULT FALSE,
ADD COLUMN replaces_operations TEXT[] DEFAULT NULL,
ADD COLUMN additional_operation BOOLEAN DEFAULT FALSE,
ADD COLUMN added_by VARCHAR(50) DEFAULT NULL,
ADD COLUMN added_at TIMESTAMP DEFAULT NULL;
```

### 3.2 Index Updates
```sql
CREATE INDEX idx_jobs_route_card ON jobs(route_card);
```

## 4. API Changes

### 4.1 Update Job Lookup API

**Modify `/api/jobs/lookup` endpoint:**
- Add fallback search logic when exact lookup fails
- Return appropriate status codes for different scenarios:
  - 404: Job not found at all (route card doesn't exist)
  - 409: Route card exists but operation not assigned (include existing operations)

### 4.2 Create New Job Operation API

**Create `/api/jobs/add-operation` endpoint:**
- Accept parameters:
  - `route_card`
  - `contract_number`
  - `operation_code`
  - `one_off` (boolean)
  - `replaces_operations` (array, optional)
  - `additional_operation` (boolean)
  - `added_by` (user ID)
- Validate input
- Create new job record
- Return the newly created job

## 5. Component Changes

### 5.1 Job Not Found Dialog
Create a new component `src/components/JobNotFoundDialog.tsx`:
- Display message that job is not in database
- Future enhancement: Add option to notify admin team

### 5.2 Add Operation Dialog
Create a new component `src/components/AddOperationDialog.tsx`:
- Ask if operation is a one-off
- Display existing operations with checkboxes if not a one-off
- Include "Additional operation" checkbox
- Submit form to add operation

### 5.3 Update ScanJobDialog
Modify `src/components/ScanJobDialog.tsx`:
- Handle new API response codes
- Display appropriate dialog based on response
- Process the dialog results

## 6. Utility Functions

### 6.1 Route Card Search
Create a new utility function in `src/utils/jobScanner.ts`:
```typescript
export const findRouteCard = async (
  routeCard: string
): Promise<{ 
  exists: boolean; 
  operations?: Array<{ op_code: string; description: string }>
}>;
```

### 6.2 Add Operation Function
Create a new utility function in `src/utils/jobScanner.ts`:
```typescript
export const addOperation = async (
  routeCard: string,
  contractNumber: string,
  operationCode: string,
  oneOff: boolean,
  replacesOperations?: string[],
  additionalOperation?: boolean,
  addedBy?: string
): Promise<JobData | null>;
```

## 7. Implementation Phases

### Phase 1: Database and API Changes
1. Implement database schema changes
2. Update API endpoints
3. Create basic utility functions

### Phase 2: Component Development
1. Develop JobNotFoundDialog component
2. Develop AddOperationDialog component
3. Update ScanJobDialog component

### Phase 3: Integration and Testing
1. Integrate all components
2. Test all scenarios:
   - Complete job not found
   - Route card found but operation missing
   - Adding one-off operation
   - Adding operation that replaces others
   - Adding additional operation

### Phase 4: Future Enhancements
1. Implement admin notification system
2. Create reporting for user-added operations
3. Develop an approval workflow for planning team

## 8. Testing Scenarios

### 8.1 Job Not Found
- Scan an invalid route card
- Verify "Job not found" dialog appears

### 8.2 Operation Not Assigned
- Scan a valid route card with an operation not assigned
- Verify "Add operation" dialog appears
- Verify existing operations are listed correctly

### 8.3 One-Off Operation
- Add a one-off operation
- Verify job proceeds normally
- Verify database record has correct flags

### 8.4 Replacement Operation
- Add an operation that replaces others
- Select multiple operations it replaces
- Verify database record has correct information

### 8.5 Additional Operation
- Add an additional operation
- Verify database record has correct flag

## 9. Considerations

### 9.1 Security and Authorization
- Determine who should be authorized to add operations
- Consider requiring supervisor approval for adding operations

### 9.2 Data Quality
- Implement validation to ensure data consistency
- Consider how user-added operations affect reporting

### 9.3 User Experience
- Keep the interface simple and intuitive
- Provide clear instructions at each step
- Allow users to cancel the process at any point

## 10. Timeline

| Task | Estimated Duration |
|------|-------------------|
| Database Changes | 1 day |
| API Updates | 2 days |
| Component Development | 3 days |
| Integration and Testing | 2 days |
| Documentation and Training | 1 day |
| **Total** | **9 days** |

## 11. Future Work

1. **Admin Notification System**
   - Email notification when jobs are not found
   - Dashboard for planning team to review user-added operations

2. **Approval Workflow**
   - Allow planning team to approve or modify user-added operations
   - Update job records with approved status

3. **Planning Improvements**
   - Analyze patterns in user-added operations
   - Improve routing templates based on actual usage

4. **Reporting**
   - Create reports showing frequency of user-added operations
   - Track efficiency metrics for planned vs. user-added operations
