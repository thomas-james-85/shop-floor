# Manufacturing System Remanufacturing Tracking Design Document

## Overview

This document outlines a comprehensive approach for implementing remanufacturing tracking in the Manufacturing Terminal System. The design addresses the need to track time and costs associated with rejected parts that require remanufacturing, particularly in complex assembly scenarios.

## Current Challenges

The existing system lacks dedicated tracking for remanufacturing operations, which creates several issues:

1. **Hidden Costs**: Time spent remanufacturing rejected parts is not distinctly tracked, hiding the true cost of quality issues
2. **Process Ambiguity**: No clear differentiation between normal manufacturing and remanufacturing
3. **Complex Assemblies**: Difficulty tracking remanufacturing for assemblies with multiple components and operations
4. **Sequential Operations**: Need to identify which operations require repeating when a reject occurs mid-process

## Requirements

A comprehensive remanufacturing tracking system should:

1. Create unique identifiers for remanufacturing jobs
2. Track time spent specifically on remanufacturing
3. Support partial remanufacturing (only repeating operations where necessary)
4. Handle complex assemblies and sub-assemblies
5. Prevent reuse of original job cards for completed/rejected work
6. Provide clear reporting on remanufacturing costs

## Proposed Solution

### Database Structure Evolution

The current system uses a relatively flat data structure. We recommend migrating to a more normalized database schema to better handle complex assemblies and remanufacturing scenarios.

#### Current Structure (Simplified)

```sql
CREATE TABLE jobs (
  lookup_code VARCHAR(50) PRIMARY KEY,
  contract_number INT NOT NULL,
  route_card INT NOT NULL,
  part_number VARCHAR(50) NOT NULL,
  op_code VARCHAR(20) NOT NULL,
  -- Other fields...
);

CREATE TABLE rejects (
  reject_id SERIAL PRIMARY KEY,
  customer_name VARCHAR(200) NOT NULL,
  contract_number INT NOT NULL,
  route_card INT NOT NULL,
  part_number VARCHAR(50) NOT NULL,
  qty_rejected INT NOT NULL,
  -- Other fields...
);
```

#### Proposed Normalized Structure

```sql
-- Parts catalog
CREATE TABLE parts (
  part_number VARCHAR(50) PRIMARY KEY,
  description TEXT,
  is_assembly BOOLEAN DEFAULT FALSE
);

-- Bill of Materials (BOM)
CREATE TABLE part_components (
  assembly_part_number VARCHAR(50) REFERENCES parts(part_number),
  component_part_number VARCHAR(50) REFERENCES parts(part_number),
  quantity INT NOT NULL,
  assembly_level INT NOT NULL,
  PRIMARY KEY (assembly_part_number, component_part_number)
);

-- Operations for each part
CREATE TABLE part_operations (
  part_number VARCHAR(50) REFERENCES parts(part_number),
  operation_code VARCHAR(20) NOT NULL,
  sequence INT NOT NULL,
  PRIMARY KEY (part_number, operation_code, sequence)
);

-- Jobs table (enhanced)
CREATE TABLE jobs (
  lookup_code VARCHAR(50) PRIMARY KEY,
  contract_number INT NOT NULL,
  route_card INT NOT NULL,
  part_number VARCHAR(50) REFERENCES parts(part_number),
  op_code VARCHAR(20) NOT NULL,
  operation_sequence INT DEFAULT 0,
  parent_part_number VARCHAR(50) NULL,
  top_level_part_number VARCHAR(50) NULL,
  assembly_level INT DEFAULT 0,
  -- Other existing fields...
);

-- Remanufacturing jobs
CREATE TABLE remanufacture_jobs (
  remanufacture_id SERIAL PRIMARY KEY,
  original_job_lookup VARCHAR(50) REFERENCES jobs(lookup_code),
  new_lookup_code VARCHAR(50) UNIQUE,
  reject_id INT REFERENCES rejects(reject_id),
  rejected_at_operation VARCHAR(20) NOT NULL,
  rejected_at_sequence INT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  quantity INT NOT NULL,
  includes_child_parts BOOLEAN DEFAULT FALSE,
  parent_remanufacture_id INT NULL REFERENCES remanufacture_jobs(remanufacture_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL
);

-- Remanufacturing operations
CREATE TABLE remanufacture_operations (
  remanufacture_id INT REFERENCES remanufacture_jobs(remanufacture_id),
  operation_code VARCHAR(20) NOT NULL,
  operation_sequence INT NOT NULL,
  is_repeat BOOLEAN DEFAULT FALSE,
  lookup_code VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (remanufacture_id, operation_code, operation_sequence)
);

-- Components involved in remanufacturing
CREATE TABLE remanufacture_components (
  remanufacture_id INT REFERENCES remanufacture_jobs(remanufacture_id),
  part_number VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  original_job_lookup VARCHAR(50) REFERENCES jobs(lookup_code),
  new_lookup_code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PENDING',
  PRIMARY KEY (remanufacture_id, part_number)
);
```

### Process Flow for Remanufacturing

#### 1. Reject Identification and Recording

When a reject occurs:

1. Record the reject in the existing `rejects` table
2. Identify the operation where the reject occurred
3. Determine which operations need to be repeated
4. For assemblies, identify all components that need remaking

#### 2. Remanufacturing Job Creation

1. Create a new entry in `remanufacture_jobs`
2. Generate a unique lookup code (e.g., `RM-{original_route_card}-{contract_number}-{op_code}`)
3. For each operation that needs repeating:
   - Create an entry in `remanufacture_operations` with `is_repeat = TRUE`
   - Generate a unique lookup code for this operation
4. For operations that don't need repeating but are part of the completion process:
   - Create an entry in `remanufacture_operations` with `is_repeat = FALSE`
   - Generate a unique lookup code for this operation
5. For assemblies:
   - Create entries in `remanufacture_components` for each component
   - Set up parent-child relationships between remanufacturing jobs

#### 3. User Interface Updates

1. When scanning a job:
   - Check if it's a remanufacturing job
   - If the original job has been replaced by a remanufacturing job, notify the user
   - If it's a remanufacturing job, show appropriate visual indicators

2. Visual Differentiation:
   - For remanufacturing operations: Show clear indicators (red background, "REMANUFACTURE" label)
   - For normal operations that are part of a remanufacture job: Show milder indicators
   - Display the reject reason prominently

#### 4. Time Tracking

1. For operations marked as `is_repeat = TRUE`:
   - Track time separately as "remanufacturing time"
   - Associate with the original reject
2. For regular operations:
   - Track time as normal production time

#### 5. Reporting

Develop new reports specifically for remanufacturing:
1. Remanufacturing time by reason
2. Remanufacturing cost by operation
3. Total impact of rejects on production capacity
4. Component-level reject rates
5. Assembly-level quality metrics

### Example Scenarios

#### Scenario 1: Single Part with Multiple Operations

A part with operations: Cutting → Breakout → Folding → Welding → Powdercoating

If a reject happens at Folding:
1. Create remanufacturing job for the part
2. Mark Cutting, Breakout, and Folding as repeat operations
3. Mark Welding and Powdercoating as normal operations

#### Scenario 2: Assembly Reject

For an assembly with components as shown in the diagram:
```
                    Top Level Assembly
                    /       |       \
                   /        |        \
            Sub Part 2   Sub Part 1   Sub Assembly 1
                                      /            \
                                     /              \
                              Sub Part 3        Sub Part 4
```

If Sub Assembly 1 fails during its assembly:
1. Create remanufacturing job for Sub Assembly 1
2. Create linked remanufacturing jobs for Sub Part 3 and Sub Part 4
3. Track time for remaking these components as remanufacturing time
4. Top Level Assembly, Sub Part 1, and Sub Part 2 continue as normal

If Top Level Assembly fails during final assembly:
1. Create remanufacturing jobs for everything in the hierarchy
2. Track all time as remanufacturing time

## Implementation Phases

### Phase 1: Basic Remanufacturing Tracking
- Add `operation_sequence` to jobs table
- Create `remanufacture_jobs` and `remanufacture_operations` tables
- Implement basic UI for scanning and identifying remanufacturing jobs
- Develop time tracking for repeat operations

### Phase 2: Assembly Support
- Implement part-component relationships
- Add support for tracking assemblies and sub-assemblies
- Enhance UI to show assembly hierarchies
- Develop component-level remanufacturing tracking

### Phase 3: Reporting and Analytics
- Develop comprehensive reporting on remanufacturing costs
- Implement dashboard for tracking reject trends
- Create efficiency metrics specific to remanufacturing
- Analysis tools for identifying quality improvement opportunities

### Phase 4: Complete Database Normalization
- Migrate to fully normalized database structure
- Implement enhanced BOM management
- Develop improved routing for complex assemblies

## Migration Considerations

Moving from the current structure to a normalized database will require:

1. Data mapping and migration planning
2. Temporary parallel operation during transition
3. UI updates to work with the new data structure
4. Retraining for system users
5. Validation process to ensure data integrity

## Conclusion

Implementing a robust remanufacturing tracking system will provide valuable insights into the true costs of quality issues and help identify opportunities for process improvement. The proposed normalized database structure offers the flexibility needed to handle complex assembly scenarios while maintaining clear separation between normal production and remanufacturing activities.

The phased implementation approach allows for gradual adoption while continuing to support current manufacturing operations.
