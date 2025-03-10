# Manufacturing Terminal System: Comprehensive Overview

## 1. System Purpose and Architecture

The Manufacturing Terminal System is a digital shop floor control application designed to streamline and monitor manufacturing operations in a factory environment. It replaces paper-based tracking with a digital solution that provides real-time visibility into production processes.

### Core Functionality

- **Digital Work Tracking**: Replaces paper-based job tracking with digital terminals at each workstation
- **Role-Based Authentication**: Different user roles (setters, operators, inspectors) with specific permissions
- **Workflow Enforcement**: Structured workflow that enforces quality inspections and proper process sequencing
- **Production Metrics**: Collection of setup times, run times, and efficiency metrics
- **Quality Control**: Built-in inspection processes with documentation

### Technical Architecture

The system uses a modern web application stack:

- **Frontend**: Next.js with React, TypeScript, and Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL hosted on AWS RDS or Neon
- **State Management**: React Context API with useReducer pattern
- **Authentication**: Role-based user authentication
- **Styling**: Tailwind CSS with shadcn/ui component library

## 2. Core Components and Workflow

### Terminal System

Each physical machine in the factory has a dedicated terminal (tablet or touchscreen) that operators interact with. Terminals are identified by:

- **Terminal ID**: Unique identifier
- **Terminal Name**: Human-readable name
- **Operation Code**: Type of operation performed at this workstation

Terminals must authenticate to access the system, and they can only perform their assigned operation types.

### User Roles

The system supports different user roles with specific permissions:

- **Setters**: Can perform machine setup (`can_setup` permission)
- **Operators**: Can run production (`can_operate` permission)
- **Inspectors**: Can approve/reject setups (`can_inspect` permission)
- **Supervisors**: Can handle remanufacturing (`can_remanufacture` permission)

Users authenticate via employee ID scanning, and the system validates their permissions for the required role.

### Terminal States

Terminals transition through the following states:

- **IDLE**: Awaiting job scanning (red background)
- **SETUP**: Machine being set up by a setter (yellow background)
- **INSPECTION_REQUIRED**: Setup needs inspection (orange background)
- **RUNNING**: Production in progress (green background)
- **PAUSED**: Temporary production halt (blue background with animation)

The system enforces a specific sequence of state transitions and tracks the time spent in each state.

### Job Workflow

The standard job workflow consists of the following steps:

1. **Terminal Login**: Authenticate terminal with ID and password
2. **Job Scanning**: Scan job barcode to retrieve job details (part number, quantity, etc.)
3. **Setter Authentication**: Setter scans ID to begin setup process
4. **Setup Phase**: Machine is prepared for production (SETUP state)
5. **First-Off Inspection**: Inspector scans ID and approves/rejects setup
6. **Production Run**: If approved, operator scans ID to begin production (RUNNING state)
7. **Optional Pausing**: Production can be paused if needed (PAUSED state)
8. **Optional In-Process Inspection**: Quality checks during production
9. **Job Completion**: Operator records completed quantity
10. **Return to IDLE**: Terminal resets for next job

### Data Logging

The system logs various events and metrics throughout the production process:

- **Setup Logs**: Track start/end times of machine setup
- **Running Logs**: Track production runs with quantities
- **Inspection Logs**: Document quality inspections and results
- **Efficiency Metrics**: Compare planned vs. actual times for setup and running

## 3. Key Features in Detail

### Job Management

Jobs are identified by:
- Contract number
- Route card number
- Part number
- Operation code

When scanned, the system displays job details including:
- Required quantity
- Balance remaining
- Customer information
- Due date
- Part description

### Authentication Flow

User authentication follows these steps:
1. User scans employee ID
2. System verifies ID against database
3. System checks if user has required permissions for the operation
4. If authenticated, system records user name and creates appropriate log entry
5. Terminal updates to show logged-in user

### Inspection Process

The system supports two types of inspections:

1. **First-Off Inspection**: Required after setup before production can begin
   - Inspector scans ID for authentication
   - Reviews setup quality
   - Passes or fails setup with comments
   - If passed, system transitions to INSPECTION_REQUIRED state
   - If failed, returns to SETUP state for corrections

2. **In-Process Inspection**: Optional quality checks during production
   - Inspector scans ID
   - Records inspection results and quantity checked
   - Production continues regardless of result (but issues are documented)

### Efficiency Tracking

The system calculates and displays efficiency metrics:

- **Setup Efficiency**: Compares planned vs. actual setup time
- **Running Efficiency**: Compares planned vs. actual production time, adjusted for quantity
- **Time Saved/Lost**: Shows whether operation was faster or slower than planned
- **Efficiency Percentage**: Calculated as (planned time / actual time) × 100

These metrics are displayed in a visual dashboard after completing setup or production.

### Pause and Resume

Production can be temporarily halted:

1. Operator initiates pause
2. System prompts for completed quantity and reason
3. Terminal transitions to PAUSED state
4. To resume, a (potentially different) operator must authenticate
5. System creates new running log and continues production

### Job Abandonment

At any stage, a job can be abandoned:

1. User initiates abandonment
2. System prompts for reason and (if in RUNNING state) completed quantity
3. System logs abandonment with reason
4. Terminal transitions back to IDLE state

## 4. Technical Implementation

### State Management

The application uses React Context API with useReducer pattern for state management. This approach:

- Centralizes all application state
- Provides typed actions for predictable state updates
- Makes debugging easier by tracking actions
- Allows for middleware-like side effects

Key state elements include:
- Terminal data (ID, name, operation code, state)
- Current job data
- Logged-in user information
- Active log tracking
- Loading and error states

### Database Structure

The PostgreSQL database includes these primary tables:

- **terminals**: Information about physical terminals
- **users**: User data with permission flags
- **jobs**: Manufacturing job details
- **job_logs**: Detailed event logs for all operations
- **efficiency_metrics**: Performance metrics for operations

The system uses a connection pool for database access and implements proper error handling and retries for database operations.

### API Routes

The application implements RESTful API routes for:

- Terminal authentication (`/api/terminal/login`)
- User authentication (`/api/users/authenticate`)
- Job lookup (`/api/jobs/lookup`)
- Job updates (`/api/jobs/update`)
- Log creation and retrieval (`/api/logs/jobs`)
- Efficiency metrics (`/api/logs/efficiency`)

These routes follow a consistent pattern:
1. Request validation
2. Database operations with proper error handling
3. Structured response with appropriate status codes

### Local Storage Persistence

The application uses localStorage to persist critical state between page refreshes:

- Terminal data (ID, name, operation code)
- Logged-in user information

This ensures that temporary network issues or page refreshes don't disrupt the workflow.

### UI Components

The UI is built with shadcn/ui components that provide a consistent design language. Key components include:

- **TerminalInfo**: Displays current terminal state and user
- **JobDetailsCard**: Shows job information
- **ScanJobDialog**: Interface for scanning job barcodes
- **ScanUserDialog**: Interface for user authentication
- **InspectionDialog**: Interface for quality inspections
- **CompletionDialog**: Interface for recording completed quantities
- **EfficiencyDisplay**: Visual representation of performance metrics

## 5. Deployment and Infrastructure

### Hosting Model

The application is designed to be hosted on Vercel, which provides:
- Automatic deployments from Git
- Preview deployments for pull requests
- Environment variables for configuration
- Analytics and monitoring

### Database Options

The system supports two database hosting options:

1. **AWS RDS**: Traditional managed PostgreSQL
2. **Neon**: Serverless PostgreSQL provider

The database adapter (`src/lib/db.ts`) can switch between these providers based on environment variables.

### Local Development

For local development, the application uses:
- Next.js development server
- Environment variables in `.env.local`
- PostgreSQL database (either local or cloud-based)

### Production Considerations

In production, the system addresses:
- **Security**: SSL for database connections, environment variables for credentials
- **Performance**: Connection pooling, efficient queries
- **Reliability**: Error handling, database connection retries
- **Monitoring**: Console logging for debugging, error tracking

## 6. Business Impact and Benefits

### Real-time Visibility

- Shop floor managers can see current machine states
- Production progress is tracked in real-time
- Issues are immediately visible and documented

### Process Enforcement

- Quality inspections are required, not optional
- Each role has specific responsibilities and permissions
- Production standards are consistently applied

### Data-Driven Improvements

- Efficiency metrics identify bottlenecks
- Planned vs. actual time comparisons improve future estimates
- Reasons for pauses and abandonment are tracked for analysis

### Digital Transformation

- Eliminates paper-based tracking
- Reduces manual data entry and errors
- Creates a digital record of all production activities

## 7. Future Enhancements

The system's architecture supports several planned enhancements:

- **Reject Handling**: Track rejected parts and reasons
- **Remanufacturing Flow**: Process for reworking rejected parts
- **Label Printing**: Generate labels at various stages
- **Offline Support**: Function when network is unavailable
- **Real-time Dashboard**: Production monitoring for management
- **Mobile App**: For supervisors to monitor production remotely

## Conclusion

The Manufacturing Terminal System represents a significant advancement in digitizing factory floor operations. By providing real-time tracking, enforcing quality procedures, and collecting valuable production data, the system drives improvements in efficiency, quality, and decision-making throughout the manufacturing process.

The modular architecture and scalable design allow for future enhancements to address evolving business needs, while the use of modern web technologies ensures a responsive, user-friendly experience for all stakeholders.
